import { login, signup } from './actions'

export default function LoginPage() {
  return (
    <div className="container vh-100 d-flex justify-content-center align-items-center">
      <div className="col-12 col-sm-8 col-md-5 col-lg-4">
        <div className="card shadow-sm">
          <div className="card-body p-4">
            <h4 className="text-center mb-4">Brave Store</h4>

            <form className="d-grid gap-3">
              <div>
                <label htmlFor="email" className="form-label">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="form-control"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  className="form-control"
                  required
                />
              </div>

              <div className="d-grid gap-2 mt-2">
                <button
                  formAction={login}
                  className="btn btn-primary"
                >
                  Log in
                </button>

                <button
                  formAction={signup}
                  className="btn btn-outline-secondary"
                >
                  Sign up
                </button>
              </div>
            </form>

          </div>
        </div>
      </div>
    </div>
  )
}
