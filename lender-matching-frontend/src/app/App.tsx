import { RouterProvider } from "react-router-dom"
import { router } from "./router"

function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <RouterProvider router={router} />
    </div>
  )
}

export default App