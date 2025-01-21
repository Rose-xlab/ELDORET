// prisma/seed.ts
import { PrismaClient, UserRole } from "@prisma/client"; 
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log("Starting database seeding...");

    // Check if data already exists
    const userCount = await prisma.user.count();
    if (userCount > 0) {
        console.log('Database already seeded, skipping...');
        return;
    }

    // Seed Users with hashed passwords
    console.log("Seeding users...");
    const _users = await Promise.all(
        [
            // Admin user
            {
                name: 'Admin User',
                email: 'admin@example.com',
                password: 'admin123',
                role: UserRole.ADMIN
            },
            // Regular users
            {
                name: 'Alice Johnson',
                email: 'alice@example.com',
                password: 'password123',
                role: UserRole.USER 
            },
            {
                name: 'Bob Smith',
                email: 'bob@example.com',
                password: 'password123',
                role: UserRole.USER 
            },
            {
                name: 'Charlie Brown',
                email: 'charlie@example.com',
                password: 'password123',
                role: UserRole.USER 
            },
            {
                name: 'Diana Prince',
                email: 'diana@example.com',
                password: 'password123',
                role: UserRole.USER 
            },
            {
                name: 'Eve Adams',
                email: 'eve@example.com',
                password: 'password123',
                role: UserRole.USER 
            },
        ].map(async (userData) => {
            const hashedPassword = await bcrypt.hash(userData.password, 12);
            return prisma.user.create({
                data: {
                    ...userData,
                    password: hashedPassword,
                },
            });
        })
    );

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
    ].map(category => 
        prisma.institutionRatingCategory.create({
            data: {
                ...category
            }
        })
    ));

    // Seed Rating Categories for Nominees
    console.log("Seeding rating categories...");
    const _ratingCategories = await Promise.all([
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
    ].map(category => 
        prisma.ratingCategory.create({
            data: {
                ...category
            }
        })
    ));

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