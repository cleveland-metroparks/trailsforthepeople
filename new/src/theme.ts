import { MantineThemeOverride } from '@mantine/core'

// Green colors from static/src/scss/_variables.scss
// $green_dark: #1D5C1F;
// $green_light: #6AB03E;

// Sidebar panel colors
export const PANEL_COLORS = {
  background: '#FFFFFF',
  heading: '#000000',
  text: '#000000',
  button: '#6AB03E',
  icon: '#6AB03E',
}

export const theme: MantineThemeOverride = {
  primaryColor: 'green',
  colors: {
    green: [
      '#f0f9f0',
      '#d4ead5',
      '#b8dbba',
      '#9ccc9f',
      '#80bd84',
      '#6AB03E', // green_light - for backgrounds/highlights (index 5)
      '#5a9a35',
      '#4a832c',
      '#3a6d23',
      '#1D5C1F', // green_dark - for text/links (better contrast) (index 9)
    ],
    // Custom gray scale with accessible dimmed color at index 6
    // #666666 on white has 5.74:1 contrast ratio (passes WCAG AA)
    gray: [
      '#f8f9fa',
      '#f1f3f5',
      '#e9ecef',
      '#dee2e6',
      '#ced4da',
      '#adb5bd',
      '#666666', // Accessible dimmed color (was #868e96)
      '#495057',
      '#343a40',
      '#212529',
    ],
  },
  // Use green_light (index 5) as the primary shade for buttons
  primaryShade: { light: 5, dark: 5 },
}
