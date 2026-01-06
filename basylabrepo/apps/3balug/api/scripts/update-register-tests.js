const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/use-cases/auth/register.use-case.test.ts');
let content = fs.readFileSync(filePath, 'utf-8');

// Find all test blocks that need the company mock
const testBlocksNeedingMock = [
  'should accept password with all required criteria',
  'should accept password with various special characters',
  'should accept valid plan',
  'should query plan by correct ID',
  'should create user with hashed password',
  'should set verification expiration time correctly',
  'should create pending subscription for new user',
  'should link subscription to user and plan',
  'should send verification code to email',
  'should include user details in response',
  'should return success message',
  'should rollback user creation if subscription fails',
  'should rollback if email sending fails',
  'should rollback subscription if email fails'
];

// Replace each test that creates mocks manually
const lines = content.split('\n');
let inTargetTest = false;
let testName = '';
let braceCount = 0;
let testStartLine = -1;
let mockLines = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  // Check if we're starting a test that needs updating
  for (const needle of testBlocksNeedingMock) {
    if (line.includes(`test("${needle}"`)) {
      inTargetTest = true;
      testName = needle;
      testStartLine = i;
      braceCount = 0;
      mockLines = [];
      break;
    }
  }

  if (inTargetTest) {
    // Count braces to know when test ends
    braceCount += (line.match(/{/g) || []).length;
    braceCount -= (line.match(/}/g) || []).length;

    // Collect mock setup lines
    if (line.trim().startsWith('mockUserRepository.findByEmail') ||
        line.trim().startsWith('mockPlanRepository.findById') ||
        line.trim().startsWith('mockUserRepository.create') ||
        line.trim().startsWith('mockCompanyRepository.create') ||
        line.trim().startsWith('mockUserRepository.update') ||
        line.trim().startsWith('mockSubscriptionRepository.create') ||
        line.trim().startsWith('const mockUser =') ||
        line.trim().startsWith('const mockCompany =')) {
      mockLines.push(i);
    }

    // If test ended, replace if we found mocks
    if (braceCount === 0 && testStartLine !== i) {
      if (mockLines.length > 0) {
        // Replace all mock lines with setupSuccessfulRegistrationMocks()
        const firstMockLine = mockLines[0];
        const lastMockLine = mockLines[mockLines.length - 1];

        // Remove all mock lines except the first
        for (let j = lastMockLine; j > firstMockLine; j--) {
          lines.splice(j, 1);
          i--;
        }

        // Replace the first mock line with our helper
        lines[firstMockLine] = '      setupSuccessfulRegistrationMocks();\n';

        console.log(`✅ Updated test: "${testName}"`);
      }

      inTargetTest = false;
      testName = '';
      mockLines = [];
    }
  }
}

const newContent = lines.join('\n');
fs.writeFileSync(filePath, newContent);

console.log('\n✨ All tests updated successfully!');
