import Foundation
import SwiftUI

// Gedeelde, observeerbare staat. Houdt de instellingen vast en de laatst
// opgehaalde status.
@MainActor
final class AppState: ObservableObject {
    @AppStorage("baseURL") var baseURL: String = ""
    @AppStorage("apiKey") var apiKey: String = ""

    @Published var status: StatusResponse?
    @Published var loadingStatus = false
    @Published var errorMessage: String?

    var client: APIClient { APIClient(baseURL: baseURL, apiKey: apiKey) }

    var isConfigured: Bool {
        !baseURL.trimmingCharacters(in: .whitespaces).isEmpty
    }

    func refreshStatus() async {
        guard isConfigured else { return }
        loadingStatus = true
        defer { loadingStatus = false }
        do {
            status = try await client.status()
            errorMessage = nil
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
