/** Personal's Host half; UI composition is owned by the client plugin. */
export const name = 'dsh-personal'

/** Mount the package without adding Host services or routes. */
export function apply(): void {
  console.info('[dsh-personal] loaded')
}
