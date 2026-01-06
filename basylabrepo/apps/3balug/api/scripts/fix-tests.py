#!/usr/bin/env python3
import re

file_path = 'src/use-cases/auth/register.use-case.test.ts'

with open(file_path, 'r') as f:
    content = f.read()

# Pattern to match the mock setup blocks that need to be replaced
pattern = r'''(      mockUserRepository\.findByEmail = mock\(\(\) => Promise\.resolve\(null\)\);
      mockPlanRepository\.findById = mock\(\(\) =>
        Promise\.resolve\(createBasicPlan\(\)\),
      \);
      mockUserRepository\.create = mock\(\(\) => Promise\.resolve\(createMockUser\(\)\)\);
      mockSubscriptionRepository\.create = mock\(\(\) =>
        Promise\.resolve\(createMockSubscription\(\)\),
      \);)'''

replacement = '      setupSuccessfulRegistrationMocks();'

# Replace the pattern
new_content = re.sub(pattern, replacement, content, flags=re.MULTILINE)

# Also handle the version with mockUser and mockCompany variables
pattern2 = r'''      const mockUser = createMockUser\(\);
      const mockCompany = createMockCompany\(\{ ownerId: mockUser\.id \}\);

      mockUserRepository\.findByEmail = mock\(\(\) => Promise\.resolve\(null\)\);
      mockPlanRepository\.findById = mock\(\(\) =>
        Promise\.resolve\(createBasicPlan\(\)\),
      \);
      mockUserRepository\.create = mock\(\(\) => Promise\.resolve\(mockUser\)\);
      mockCompanyRepository\.create = mock\(\(\) => Promise\.resolve\(mockCompany\)\);
      mockUserRepository\.update = mock\(\(\) =>
        Promise\.resolve\(\{ \.\.\.mockUser, companyId: mockCompany\.id \}\),
      \);
      mockSubscriptionRepository\.create = mock\(\(\) =>
        Promise\.resolve\(createMockSubscription\(\)\),
      \);'''

new_content = re.sub(pattern2, replacement, new_content, flags=re.MULTILINE)

with open(file_path, 'w') as f:
    f.write(new_content)

print("✅ Tests fixed successfully!")
