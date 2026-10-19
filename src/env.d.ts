// Types globaux du site

// Les variables CSS passées en style (style={{ '--o': '26vh' }}) : React les accepte, TypeScript doit le savoir
import 'react'
declare module 'react' {
  interface CSSProperties {
    [variable: `--${string}`]: string | number | undefined
  }
}
