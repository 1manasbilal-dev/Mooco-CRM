# Task 3-c: Add Dark Mode Support to Customers Page

## Task
Add dark: Tailwind classes systematically to /home/z/my-project/src/components/pages/customers-page.tsx

## Work Completed
- Added dark mode variants to all 12 key areas of the customers page
- Used global replace_all for safe patterns (text-gray-*, border-gray-*, bg-gray-100, hover:bg-gray-*)
- Used targeted edits for complex patterns (badges, gradients, ternary expressions, icon backgrounds)
- Fixed cascading replacement duplicates from replace_all operations
- Fixed hover:text patterns that incorrectly got dark:text instead of dark:hover:text

## Key Changes
- Text colors: all text-gray-* variants now have dark: counterparts
- Borders: border-gray-200/80 → dark:border-gray-700, border-gray-100 → dark:border-gray-800, border-gray-200 → dark:border-gray-700
- Backgrounds: bg-white → dark:bg-gray-900, bg-gray-50 → dark:bg-gray-800/50, bg-gray-100 → dark:bg-gray-800
- Badges: status badges got dark:bg-*-950 dark:text-*-300 dark:border-*-800
- Gradients: all from-*-50 to-*-50 got dark:from-*-950 dark:to-*-950
- Icon bgs: bg-green-50 → dark:bg-green-950/50, bg-green-100 → dark:bg-green-900/50, etc.
- Colored text: text-*-800 → dark:text-*-200, text-*-700 → dark:text-*-300
- Hover states: all hover:bg-gray-* and hover:bg-colored-* got dark: variants

## Verification
- Lint passes clean
- No duplicate dark: classes
- Dev server running without errors
