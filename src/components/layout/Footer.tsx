export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm text-gray-400 mb-4 md:mb-0">
            © {new Date().getFullYear()} RoomRental. All rights reserved.
          </div>
          <div className="text-sm text-gray-400">
            Developed by{" "}
            <a
              href="https://github.com/aaditya"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              @aaditya
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
