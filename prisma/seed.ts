// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

async function main() {
    console.log("Starting database seeding...");

// Check if data already exists
const userCount = await prisma.user.count();
if (userCount > 0) {
    console.log('Database already seeded, skipping...');
    return;
}

    // Seed Users
    console.log("Seeding users...");
    const users = await Promise.all(
        [
            { name: 'Alice Johnson', email: 'alice@example.com', password: 'password123' },
            { name: 'Bob Smith', email: 'bob@example.com', password: 'password123' },
            { name: 'Charlie Brown', email: 'charlie@example.com', password: 'password123' },
            { name: 'Diana Prince', email: 'diana@example.com', password: 'password123' },
            { name: 'Eve Adams', email: 'eve@example.com', password: 'password123' },
        ].map((userData) =>
            prisma.user.create({
                data: userData,
            })
        )
    );

    // Seed Districts
    console.log("Seeding districts...");
    const districts = await Promise.all(
        [
            { name: 'Kampala', region: 'Central' },
            { name: 'Gulu', region: 'Northern' },
            { name: 'Mbarara', region: 'Western' },
            { name: 'Mbale', region: 'Eastern' },
            { name: 'Jinja', region: 'Eastern' },
        ].map((districtData) =>
            prisma.district.create({
                data: districtData,
            })
        )
    );

    // Seed Institutions
    console.log("Seeding institutions...");
    const institutions = await Promise.all(
        [
            { name: 'Makerere University', status: true },
            { name: 'Mulago Hospital', status: true },
            { name: 'Bank of Uganda', status: true },
            { name: 'Uganda Revenue Authority', status: true },
            { name: 'KCCA', status: true },
        ].map((institutionData) =>
            prisma.institution.create({
                data: institutionData,
            })
        )
    );

    // Seed Positions
    console.log("Seeding positions...");
    const positions = await Promise.all(
        ['Cabinet Secretary', 'Minister', 'Mayor', 'County Governor', 'Managing Director']
        .map((name) =>
            prisma.position.create({
                data: { name },
            })
        )
    );

    // Seed Nominees
    console.log("Seeding nominees...");
    const nominees = await Promise.all(
        [
            { 
                name: 'John Doe',
                position: { connect: { id: positions[0].id } },
                institution: { connect: { id: institutions[0].id } },
                district: { connect: { id: districts[0].id } },
                status: true 
            },
            { 
                name: 'Jane Smith',
                position: { connect: { id: positions[1].id } },
                institution: { connect: { id: institutions[1].id } },
                district: { connect: { id: districts[1].id } },
                status: false 
            },
            { 
                name: 'Paul Johnson',
                position: { connect: { id: positions[2].id } },
                institution: { connect: { id: institutions[2].id } },
                district: { connect: { id: districts[2].id } },
                status: true 
            },
            { 
                name: 'Emily Davis',
                position: { connect: { id: positions[3].id } },
                institution: { connect: { id: institutions[3].id } },
                district: { connect: { id: districts[3].id } },
                status: false 
            },
            { 
                name: 'Michael Brown',
                position: { connect: { id: positions[4].id } },
                institution: { connect: { id: institutions[4].id } },
                district: { connect: { id: districts[4].id } },
                status: true 
            },
        ].map((nomineeData) =>
            prisma.nominee.create({
                data: nomineeData,
            })
        )
    );

    // Seed Departments
    console.log("Seeding departments...");
    const departments = await Promise.all([
        'Finance', 'Health', 'Legal', 'Licensing', 'Procurement', 'Revenue', 
        'Public Services', 'Human Resources', 'Treasury', 'Urban Planning', 
        'Social Services', 'Development Projects'
    ].map((name) => 
        prisma.department.create({
            data: { name }
        })
    ));

    // Seed Impact Areas
    console.log("Seeding impact areas...");
    const impactAreas = await Promise.all([
        'Financial', 'Healthcare', 'Legal System', 'Infrastructure', 
        'Education', 'Public Safety', 'Environment', 'Economic Development'
    ].map((name) => 
        prisma.impactArea.create({
            data: { name }
        })
    ));

    // Seed Institution Rating Categories
    console.log("Seeding institution rating categories...");
    const _institutionRatingCategories = await Promise.all([
        {
            keyword: "prevalence-of-bribery",
            name: "Prevalence of Bribery",
            icon: "💰",
            description: "Systematic occurrence of bribery",
            weight: 5,
            examples: [
                "Widespread bribe collection",
                "Systematic corruption",
                "Regular illegal payments"
            ]
        },
        {
            keyword: "extent-of-embezzlement",
            name: "Extent of Embezzlement",
            icon: "🏦",
            description: "Scale of funds misappropriation",
            weight: 5,
            examples: [
                "Systemic fund diversion",
                "Resource misappropriation",
                "Financial misconduct"
            ]
        },
        {
            keyword: 'nepotism',
            name: 'Level of Nepotism',
            icon: '👥',
            description: 'Favoring relatives in appointments and contracts',
            weight: 3,
            examples: [
                'Hiring family members',
                'Awarding contracts to relatives',
                'Creating positions for friends'
            ]
        },
        {
            keyword: "incidence-of-nepotism",
            name: "Incidence of Nepotism",
            icon: "👥",
            description: "Systematic favoritism of relatives",
            weight: 4,
            examples: [
                "Family-based hiring",
                "Relative favoritism",
                "Nepotistic practices"
            ]
        },
        {
            keyword: "frequency-of-fraud",
            name: "Frequency of Fraud",
            icon: "🎭",
            description: "Occurrence of fraudulent activities",
            weight: 5,
            examples: [
                "Document falsification",
                "False claims",
                "Procurement manipulation"
            ]
        },
        {
            keyword: "level-of-conflict",
            name: "Level of Conflict of Interest",
            icon: "⚖️",
            description: "Extent of conflicts of interest",
            weight: 4,
            examples: [
                "Business conflicts",
                "Personal interests",
                "Decision bias"
            ]
        },
        {
            keyword: "transparency-level",
            name: "Transparency of Operations",
            icon: "👁️",
            description: "Level of operational transparency",
            weight: 4,
            examples: [
                "Information access",
                "Process clarity",
                "Decision transparency"
            ]
        },
        {
            keyword: "abuse-of-authority",
            name: "Abuse of Authority",
            icon: "👊",
            description: "Institutional misuse of power",
            weight: 5,
            examples: [
                "Power misuse",
                "Authority abuse",
                "Resource misappropriation"
            ]
        },
        {
            keyword: "degree-of-cronyism",
            name: "Degree of Cronyism",
            icon: "🤝",
            description: "Extent of favoritism practices",
            weight: 4,
            examples: [
                "Friend favoritism",
                "Biased appointments",
                "Unfair advantages"
            ]
        },
        {
            keyword: "unexplained-wealth-officials",
            name: "Unexplained Wealth among Officials",
            icon: "💎",
            description: "Officials' unexplained wealth",
            weight: 4,
            examples: [
                "Suspicious assets",
                "Unexplained riches",
                "Wealth discrepancies"
            ]
        },
        {
            keyword: "corruption-responsiveness",
            name: "Responsiveness to Corruption",
            icon: "⚡",
            description: "Response to corruption reports",
            weight: 3,
            examples: [
                "Report handling",
                "Investigation speed",
                "Action effectiveness"
            ]
        }
    ].map(async (category) => {
        const selectedImpactAreas = faker.helpers.arrayElements(impactAreas, 2);
        const selectedDepartments = faker.helpers.arrayElements(departments, 2);
        
        return prisma.institutionRatingCategory.create({
            data: {
                ...category,
                impactAreas: {
                    connect: selectedImpactAreas.map(area => ({ id: area.id }))
                },
                departments: {
                    connect: selectedDepartments.map(dept => ({ id: dept.id }))
                }
            }
        });
    }));

    // Seed Rating Categories for Nominees
    console.log("Seeding rating categories...");
    const ratingCategories = await Promise.all([
        {
            keyword: 'bribery',
            name: 'Bribery',
            icon: '💰',
            description: 'Taking or soliciting bribes for services or favors',
            weight: 5,
            examples: [
                'Demanding payment for government services',
                'Accepting kickbacks from contractors',
                'Bribes for tender awards'
            ]
        },
        {
            keyword: 'embezzlement',
            name: 'Embezzlement',
            icon: '🏦',
            description: 'Theft or misappropriation of public funds',
            weight: 5,
            examples: [
                'Missing public funds',
                'Unauthorized use of resources',
                'Fraudulent claims'
            ]
        },
        {
            keyword: 'fraud',
            name: 'Fraud',
            icon: '📄',
            description: 'Deceptive practices for personal gain',
            weight: 13,
            examples: [
                'Procurement fraud',
                'False documentation',
                'Inflated contracts'
            ]
        },
        {
            keyword: 'conflict',
            name: 'Conflict of Interest',
            icon: '⚖️',
            description: 'Using public office for private benefit',
            weight: 8,
            examples: [
                'Hidden business interests',
                'Personal benefit from decisions',
                'Unfair advantages'
            ]
        },
        {
            keyword: 'transparency',
            name: 'Lack of Transparency',
            icon: '🔍',
            description: 'Concealing information from the public',
            weight: 7,
            examples: [
                'Hidden records',
                'Secret decisions',
                'Blocked information access'
            ]
        },
        {
            keyword: 'abuse',
            name: 'Abuse of Power',
            icon: '👊',
            description: 'Misusing official position and authority',
            weight: 12,
            examples: [
                'Intimidation',
                'Misuse of resources',
                'Abuse of authority'
            ]
        },
        {
            keyword: 'cronyism',
            name: 'Cronyism',
            icon: '🤝',
            description: 'Favoring friends and associates',
            weight: 8,
            examples: [
                'Political appointments',
                'Biased contract awards',
                'Favorable treatment'
            ]
        },
        {
            keyword: 'wealth',
            name: 'Unexplained Wealth',
            icon: '💎',
            description: 'Assets and lifestyle beyond known income',
            weight: 10,
            examples: [
                'Luxury properties',
                'Unexplained assets',
                'Hidden wealth'
            ]
        },
        {
            keyword: 'neglect',
            name: 'Neglect of Duty',
            icon: '⚡',
            description: 'Failing to perform official responsibilities',
            weight: 5,
            examples: [
                'Absenteeism',
                'Project delays',
                'Service delivery failure'
            ]
        },
        {
            keyword: 'nepotism',
            name: 'Nepotism',
            icon: '👥',
            description: 'Favoring relatives in appointments and contracts',
            weight: 4,
            examples: [
                'Hiring family members',
                'Awarding contracts to relatives',
                'Creating positions for friends'
            ]
        }
    ].map(async (category) => {
        const selectedImpactAreas = faker.helpers.arrayElements(impactAreas, 2);
        const selectedDepartments = faker.helpers.arrayElements(departments, 2);
        
        return prisma.ratingCategory.create({
            data: {
                ...category,
                impactAreas: {
                    connect: selectedImpactAreas.map(area => ({ id: area.id }))
                },
                departments: {
                    connect: selectedDepartments.map(dept => ({ id: dept.id }))
                }
            }
        });
    }));

    // Seed ratings and comments for each nominee
    console.log("Seeding ratings and comments...");
    for (const nominee of nominees) {
        for (let i = 0; i < 3; i++) {
            const comment = faker.lorem.sentence();
            
            try {
                // Create NomineeRating
                await prisma.nomineeRating.create({
                    data: {
                        userId: faker.helpers.arrayElement(users).id,
                        nomineeId: nominee.id,
                        ratingCategoryId: (await ratingCategories[0]).id,
                        score: faker.number.int({ min: 1, max: 5 }),
                        comment
                    }
                });

                // Create Comment
                await prisma.comment.create({
                    data: {
                        content: comment,
                        userId: faker.helpers.arrayElement(users).id,
                        nomineeId: nominee.id,
                    }
                });
            } catch (error) {
                console.error(`Error creating rating/comment for nominee ${nominee.id}:`, error);
            }
        }
    }

    // Seed scandals for first two nominees
    console.log("Seeding scandals...");
    for (const nominee of nominees.slice(0, 2)) {
        try {
            await prisma.scandal.create({
                data: {
                    title: faker.lorem.sentence(),
                    description: faker.lorem.paragraphs(2),
                    sourceUrl: faker.internet.url(),
                    verified: true,
                    nomineeId: nominee.id,
                    createdBy: faker.helpers.arrayElement(users).id,
                }
            });
        } catch (error) {
            console.error(`Error creating scandal for nominee ${nominee.id}:`, error);
        }
    }

    console.log('Database seeding completed successfully!');
}

main()
    .then(async () => {
        console.log('Seeding process finished successfully.');
        await prisma.$disconnect();
    })
    .catch(async (error) => {
        console.error('Error during seeding:', error);
        await prisma.$disconnect();
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });