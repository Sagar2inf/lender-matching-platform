import { useNavigate } from "react-router-dom"

function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-100">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8 space-y-6">
        
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-semibold text-gray-900">
            Lender Matching Platform
          </h1>
          <p className="text-sm text-gray-500">
            Connect borrowers with the right lenders
          </p>
        </div>

        <div className="space-y-3">
          <button
            className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm font-medium
                       hover:bg-gray-50 transition"
            onClick={() => navigate("/borrower/form")}
          >
            Look for Lender
          </button>

          <button
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white
                       hover:bg-blue-700 transition"
            onClick={() => navigate("/lender/register")}
          >
            Register as Lender
          </button>

          <button
            className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm font-medium
                       hover:bg-gray-50 transition"
            onClick={() => navigate("/lender/login")}
          >
            Enter Your Lender ID
          </button>
        </div>

      </div>
    </div>
  )
}

export default LandingPage