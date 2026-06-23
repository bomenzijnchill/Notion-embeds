import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var state: AppState

    var body: some View {
        NavigationStack {
            Form {
                Section("Backend") {
                    TextField("Server-URL (bv. https://abc.ngrok.io)", text: $state.baseURL)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .keyboardType(.URL)
                    SecureField("API-sleutel (APP_API_KEY)", text: $state.apiKey)
                }

                Section("Status") {
                    if let s = state.status {
                        LabeledContent("Gekoppeld", value: s.connected ? "Ja ✅" : "Nee")
                        if let id = s.userId, !id.isEmpty {
                            LabeledContent("Account-id", value: id)
                        }
                        if let exp = s.tokenExpiryDate {
                            LabeledContent("Token verloopt", value: exp.formatted(date: .abbreviated, time: .omitted))
                        }
                    } else {
                        Text("Nog geen status opgehaald.").foregroundStyle(.secondary)
                    }
                    Button {
                        Task { await state.refreshStatus() }
                    } label: {
                        if state.loadingStatus { ProgressView() } else { Text("Status verversen") }
                    }
                }

                if let s = state.status, !s.connected {
                    Section {
                        Link(destination: connectURL) {
                            Label("Koppel met Instagram", systemImage: "link")
                        }
                    } footer: {
                        Text("Opent de koppelpagina van je backend in Safari. Daarna eenmalig inloggen bij Instagram.")
                    }
                }

                if let err = state.errorMessage {
                    Section {
                        Text(err).foregroundStyle(.red).font(.callout)
                    }
                }
            }
            .navigationTitle("Instellingen")
        }
    }

    private var connectURL: URL {
        let base = state.baseURL.trimmingCharacters(in: .whitespaces)
        return URL(string: base + "/auth/start") ?? URL(string: "https://instagram.com")!
    }
}
