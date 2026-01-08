import { MantineThemeOverride } from '@mantine/core'

// Green colors from static/src/scss/_variables.scss
// $green_dark: #1D5C1F;
// $green_light: #6AB03E;

export const theme: MantineThemeOverride = {
  primaryColor: 'green',
  colors: {
    green: [
      '#f0f9f0',
      '#d4ead5',
      '#b8dbba',
      '#9ccc9f',
      '#80bd84',
      '#6AB03E', // green_light - for backgrounds/highlights
      '#5a9a35',
      '#4a832c',
      '#3a6d23',
      '#1D5C1F', // green_dark - for text/links (better contrast)
    ],
  },
  // Use darker green (index 9) as the primary shade for better contrast
  primaryShade: { light: 9, dark: 6 },
}
