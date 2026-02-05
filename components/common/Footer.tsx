export function Footer() {
  return (
    <footer className="bg-gray-800 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">ceuHUB</h3>
            <p className="text-gray-400">
              Your platform for continuing education and professional development.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-gray-400">
              <li>
                <a href="/courses" className="hover:text-white">
                  Browse Courses
                </a>
              </li>
              <li>
                <a href="/dashboard" className="hover:text-white">
                  Dashboard
                </a>
              </li>
              <li>
                <a href="/dashboard/certificates" className="hover:text-white">
                  Certificates
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <p className="text-gray-400">
              For questions or support, please contact us at{' '}
              <a href="mailto:support@ceuhub.com" className="hover:text-white">
                support@ceuhub.com
              </a>
            </p>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-700 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} ceuHUB. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}


