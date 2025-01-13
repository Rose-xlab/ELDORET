import { NextRequest, NextResponse } from "next/server";
import { parse } from "csv-parse/sync";
import { prisma } from "@/lib/prisma";
import { Position, Institution, District } from "@prisma/client";

interface CSVRecord {
  name: string;
  position: string;
  institution: string;
  district: string;
  region: string;
}

interface ProcessingSummary {
  positions: { created: number; existing: number };
  institutions: { created: number; existing: number };
  districts: { created: number; existing: number };
  nominees: { created: number; failed: number; duplicates: number };
}

interface EntityMaps {
  positions: Map<string, Position>;
  institutions: Map<string, Institution>;
  districts: Map<string, District>;
}

function normalizeString(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s-]/g, '')
    .replace(/^the\s+/, '');
}

// Modified to return unique entities with their original names
function deduplicateEntities(records: CSVRecord[]) {
  const uniquePositions = new Map<string, string>();  // normalized -> original
  const uniqueInstitutions = new Map<string, string>();
  const uniqueDistricts = new Map<string, { name: string; region: string }>();

  records.forEach(record => {
    const normalizedPosition = normalizeString(record.position);
    const normalizedInstitution = normalizeString(record.institution);
    const normalizedDistrict = normalizeString(record.district);

    // Store original names with normalized keys
    uniquePositions.set(normalizedPosition, record.position);
    uniqueInstitutions.set(normalizedInstitution, record.institution);
    uniqueDistricts.set(normalizedDistrict, {
      name: record.district,
      region: record.region
    });
  });

  return {
    positions: Array.from(uniquePositions.entries()),
    institutions: Array.from(uniqueInstitutions.entries()),
    districts: Array.from(uniqueDistricts.entries()).map(([normalized, data]) => ({
      normalized,
      name: data.name,
      region: data.region
    }))
  };
}

async function getAllExistingEntities(): Promise<EntityMaps> {
  const [positions, institutions, districts] = await Promise.all([
    prisma.position.findMany(),
    prisma.institution.findMany(),
    prisma.district.findMany(),
  ]);

  return {
    positions: new Map(positions.map(p => [normalizeString(p.name), p])),
    institutions: new Map(institutions.map(i => [normalizeString(i.name), i])),
    districts: new Map(districts.map(d => [normalizeString(d.name), d]))
  };
}

async function getOrCreateEntities(
  uniqueEntities: ReturnType<typeof deduplicateEntities>,
  existingEntities: EntityMaps,
  summary: ProcessingSummary
) {
  const entityCache = {
    positions: new Map<string, number>(),
    institutions: new Map<string, number>(),
    districts: new Map<string, number>()
  };

  // Process positions
  for (const [normalizedName, originalName] of uniqueEntities.positions) {
    const existingPosition = existingEntities.positions.get(normalizedName);
    if (existingPosition) {
      entityCache.positions.set(normalizedName, existingPosition.id);
      summary.positions.existing++;
    } else {
      const newPosition = await prisma.position.create({
        data: { name: originalName }
      });
      entityCache.positions.set(normalizedName, newPosition.id);
      summary.positions.created++;
    }
  }

  // Process institutions
  for (const [normalizedName, originalName] of uniqueEntities.institutions) {
    const existingInstitution = existingEntities.institutions.get(normalizedName);
    if (existingInstitution) {
      entityCache.institutions.set(normalizedName, existingInstitution.id);
      summary.institutions.existing++;
    } else {
      const newInstitution = await prisma.institution.create({
        data: { 
          name: originalName,
          status: false
        }
      });
      entityCache.institutions.set(normalizedName, newInstitution.id);
      summary.institutions.created++;
    }
  }

  // Process districts
  for (const district of uniqueEntities.districts) {
    const existingDistrict = existingEntities.districts.get(district.normalized);
    if (existingDistrict) {
      entityCache.districts.set(district.normalized, existingDistrict.id);
      summary.districts.existing++;
    } else {
      const newDistrict = await prisma.district.create({
        data: {
          name: district.name,
          region: district.region
        }
      });
      entityCache.districts.set(district.normalized, newDistrict.id);
      summary.districts.created++;
    }
  }

  return entityCache;
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file = data.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'No valid file provided' },
        { status: 400 }
      );
    }

    const csvText = await file.text();
    const records = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as CSVRecord[];

    const summary: ProcessingSummary = {
      positions: { created: 0, existing: 0 },
      institutions: { created: 0, existing: 0 },
      districts: { created: 0, existing: 0 },
      nominees: { created: 0, failed: 0, duplicates: 0 }
    };

    // Get unique entities with their original names
    const uniqueEntities = deduplicateEntities(records);
    
    // Get existing entities from database
    const existingEntities = await getAllExistingEntities();
    
    // Get or create entities and get cache
    const entityCache = await getOrCreateEntities(uniqueEntities, existingEntities, summary);
    
    // Track nominee names to prevent duplicates within the batch
    const processedNominees = new Set<string>();

    // Process nominees
    const results = await Promise.all(records.map(async (record) => {
      try {
        // Validate required fields
        if (!record.name?.trim() || !record.position?.trim() || 
            !record.institution?.trim() || !record.district?.trim() || 
            !record.region?.trim()) {
          summary.nominees.failed++;
          return {
            success: false,
            nominee: record.name || 'Unknown',
            error: 'Missing required fields'
          };
        }

        // Check for duplicate nominee within batch
        const normalizedName = normalizeString(record.name);
        if (processedNominees.has(normalizedName)) {
          summary.nominees.duplicates++;
          return {
            success: false,
            nominee: record.name,
            error: 'Duplicate nominee in current batch',
            duplicate: true
          };
        }

        // Check for existing nominee in database
        const existingNominee = await prisma.nominee.findFirst({
          where: {
            name: {
              equals: record.name.trim(),
              mode: 'insensitive'
            }
          }
        });

        if (existingNominee) {
          summary.nominees.duplicates++;
          return {
            success: false,
            nominee: record.name,
            error: 'Nominee already exists in database',
            duplicate: true
          };
        }

        // Get entity IDs from cache using normalized names
        const positionId = entityCache.positions.get(normalizeString(record.position));
        const institutionId = entityCache.institutions.get(normalizeString(record.institution));
        const districtId = entityCache.districts.get(normalizeString(record.district));

        if (!positionId || !institutionId || !districtId) {
          throw new Error('Required entity not found in cache');
        }

        // Create nominee
        const nominee = await prisma.nominee.create({
          data: {
            name: record.name.trim(),
            positionId,
            institutionId,
            districtId,
            status: false
          }
        });

        processedNominees.add(normalizedName);
        summary.nominees.created++;

        return {
          success: true,
          nominee: record.name,
          data: nominee
        };

      } catch (error) {
        summary.nominees.failed++;
        return {
          success: false,
          nominee: record.name || 'Unknown',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }));

    return NextResponse.json({
      message: 'Bulk upload completed',
      summary: {
        total: records.length,
        successful: summary.nominees.created,
        failed: summary.nominees.failed,
        duplicates: summary.nominees.duplicates,
        details: summary
      },
      results
    });

  } catch (error) {
    console.error('Error processing upload:', error);
    return NextResponse.json(
      {
        error: 'Failed to process upload',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}