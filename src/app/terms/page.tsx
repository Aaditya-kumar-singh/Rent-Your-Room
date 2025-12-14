export const dynamic = "force-static";

export default function TermsPage() {
	return (
		<div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
			<div className="bg-white shadow-sm rounded-lg p-8">
				<h1 className="text-3xl font-bold text-gray-900 mb-8 border-b pb-4">Terms of Service</h1>

				<div className="space-y-6 text-gray-600">
					<section>
						<h2 className="text-xl font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
						<p>
							By accessing and using RoomRental, you accept and agree to be bound by the terms and provision of this agreement.
							In addition, when using this websites particular services, you shall be subject to any posted guidelines or rules applicable to such services.
						</p>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-gray-900 mb-3">2. User Accounts</h2>
						<p>
							To use certain features of the service, you must register for an account. You agree to provide accurate, current,
							and complete information during the registration process and to update such information to keep it accurate, current, and complete.
							You are responsible for safeguarding your password and for all activities that occur under your account.
						</p>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-gray-900 mb-3">3. Room Listings and Bookings</h2>
						<ul className="list-disc pl-5 space-y-2">
							<li><strong>For Owners:</strong> You agree that all rooms listed are safe, habitable, and accurately described. You are solely responsible for ensuring that your listings comply with all applicable laws and regulations.</li>
							<li><strong>For Seekers:</strong> You agree to communicate professionally and pay any agreed-upon rents or deposits directly to the owner in accordance with your mutual agreement. RoomRental is not a party to the rental transaction itself.</li>
						</ul>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-gray-900 mb-3">4. Conduct and Prohibited Activities</h2>
						<p>
							You agree not to use the service for any unlawful purpose or to conduct any unlawful activity, including, but not limited to, fraud, embezzlement, money laundering, or identity theft.
							Abusive, harassing, or discriminatory behavior towards other users will result in immediate account termination.
						</p>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-gray-900 mb-3">5. Limitation of Liability</h2>
						<p>
							RoomRental is a platform connecting room owners and seekers. We are not a real estate broker or landlord.
							We do not endorse any user or listing and are not responsible for the accuracy of listings or the conduct of users.
							In no event shall RoomRental be liable for any indirect, incidental, special, consequential or punitive damages.
						</p>
					</section>

					<section>
						<h2 className="text-xl font-semibold text-gray-900 mb-3">6. Modifications to Terms</h2>
						<p>
							We reserve the right to change these terms at any time. Your continued use of the site after any such changes constitutes your acceptance of the new Terms of Service.
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


