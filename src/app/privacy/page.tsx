export const dynamic = "force-static";

export default function PrivacyPage() {
	return (
		<div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
			<div className="bg-white shadow-sm rounded-lg p-8">
				<h1 className="text-3xl font-bold text-gray-900 mb-8 border-b pb-4">Privacy Policy</h1>

				<div className="space-y-6 text-gray-600">
					<section>
						<h2 className="text-xl font-semibold text-gray-900 mb-3">1. Introduction</h2>
						<p>
							Welcome to RoomRental. We value your privacy and are committed to protecting your personal information.
							This Privacy Policy explains how we collect, use, disclosure, and safeguard your information when you visit our website
							or use our room rental services.
						</p>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-gray-900 mb-3">2. Information We Collect</h2>
						<p className="mb-2">We may collect information about you in a variety of ways. The information we may collect includes:</p>
						<ul className="list-disc pl-5 space-y-2">
							<li><strong>Personal Data:</strong> Name, email address, phone number, and profile image when you register.</li>
							<li><strong>Listing Data:</strong> Details about the rooms needed for listing, including addresses, photos, and rent prices.</li>
							<li><strong>Usage Data:</strong> Information about your interactions with the platform, search queries, and booking history.</li>
						</ul>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-gray-900 mb-3">3. How We Use Your Information</h2>
						<p>We use the information we collect to:</p>
						<ul className="list-disc pl-5 space-y-2 mt-2">
							<li>Facilitate the creation of listing and booking processes.</li>
							<li>Communicate with you regarding bookings, inquiries, or support.</li>
							<li>Improve the functionality and user experience of our platform.</li>
							<li>Prevent fraudulent activities and ensure the security of our users.</li>
						</ul>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-gray-900 mb-3">4. Sharing of Your Information</h2>
						<p>
							We do not sell your personal data. We may share information with:
						</p>
						<ul className="list-disc pl-5 space-y-2 mt-2">
							<li><strong>Room Owners/Seekers:</strong> Minimal contact info is shared only upon confirmed booking interest to facilitate communication.</li>
							<li><strong>Service Providers:</strong> Third-party vendors who perform services for us (e.g., cloud hosting, authentication).</li>
							<li><strong>Legal Requirements:</strong> If required by law or to protect the rights and safety of RoomRental and its users.</li>
						</ul>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-gray-900 mb-3">5. Data Security</h2>
						<p>
							We use administrative, technical, and physical security measures to help protect your personal information.
							While we have taken reasonable steps to secure the personal information you provide to us, please be aware that no security measures are perfect or impenetrable.
						</p>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-gray-900 mb-3">6. Contact Us</h2>
						<p>
							If you have questions or comments about this Privacy Policy, please contact us at: <br />
							<a href="mailto:support@roomrental.com" className="text-blue-600 hover:underline">support@roomrental.com</a>
						</p>
					</section>

					<div className="pt-6 border-t text-sm text-gray-500">
						Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
					</div>
				</div>
			</div>
		</div>
	);
}


