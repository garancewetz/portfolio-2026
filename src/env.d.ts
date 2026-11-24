// Global types for the site

// CSS variables passed in style (style={{ '--o': '26vh' }}): React accepts them, TypeScript needs to know
import 'react'
declare module 'react' {
  interface CSSProperties {
    [variable: `--${string}`]: string | number | undefined
  }
}
