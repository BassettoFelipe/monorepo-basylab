import { readFileSync, writeFileSync } from "fs";

const filePath = "src/use-cases/auth/register.use-case.test.ts";
let content = readFileSync(filePath, "utf-8");

// Pattern to find and replace the mock setup blocks
const oldPattern = /mockUserRepository\.findByEmail = mock\(\(\) => Promise\.resolve\(null\)\);\s*mockPlanRepository\.findById = mock\(\(\) =>\s*Promise\.resolve\(createBasicPlan\(\)\),?\s*\);\s*mockUserRepository\.create = mock\(\(\) => Promise\.resolve\(createMockUser\(\)\)\);\s*mockSubscriptionRepository\.create = mock\(\(\) =>\s*Promise\.resolve\(createMockSubscription\(\)\),?\s*\);/g;

const newPattern = "setupSuccessfulRegistrationMocks();";

content = content.replace(oldPattern, newPattern);

// Also handle variations
const oldPattern2 = /const mockUser = createMockUser\(\);\s*const mockCompany = createMockCompany\(\{ ownerId: mockUser\.id \}\);\s*mockUserRepository\.findByEmail = mock\(\(\) => Promise\.resolve\(null\)\);\s*mockPlanRepository\.findById = mock\(\(\) =>\s*Promise\.resolve\(createBasicPlan\(\)\),?\s*\);\s*mockUserRepository\.create = mock\(\(\) => Promise\.resolve\(mockUser\)\);\s*mockCompanyRepository\.create = mock\(\(\) => Promise\.resolve\(mockCompany\)\);\s*mockUserRepository\.update = mock\(\(\) => Promise\.resolve\(\{ \.\.\.mockUser, companyId: mockCompany\.id \}\)\);\s*mockSubscriptionRepository\.create = mock\(\(\) =>\s*Promise\.resolve\(createMockSubscription\(\)\),?\s*\);/g;

content = content.replace(oldPattern2, newPattern);

writeFileSync(filePath, content);
console.log("✅ File updated successfully!");
