import type { HttpContext } from '@adonisjs/core/http'

export default class UsersController {
  public async login({ auth, request }: HttpContext): Promise<void> {
    auth.user?.email
  }
}
