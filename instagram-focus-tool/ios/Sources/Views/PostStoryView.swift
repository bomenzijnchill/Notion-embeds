import SwiftUI

struct PostStoryView: View {
    @EnvironmentObject var state: AppState

    @State private var mediaType = MediaType.image
    @State private var url = ""
    @State private var publishing = false
    @State private var result: String?
    @State private var error: String?

    enum MediaType: String, CaseIterable, Identifiable {
        case image = "Foto"
        case video = "Video"
        var id: String { rawValue }
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    Picker("Type", selection: $mediaType) {
                        ForEach(MediaType.allCases) { Text($0.rawValue).tag($0) }
                    }
                    .pickerStyle(.segmented)

                    TextField("Publieke media-URL", text: $url)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .keyboardType(.URL)
                } header: {
                    Text("Story plaatsen")
                } footer: {
                    Text("De foto/video moet op een publiek bereikbare URL staan; Instagram haalt het bestand zelf op. Een story telt mee in je dagelijkse publicatielimiet.")
                }

                Section {
                    Button {
                        Task { await publish() }
                    } label: {
                        if publishing { ProgressView() } else { Text("Plaats story") }
                    }
                    .disabled(url.isEmpty || publishing)
                }

                if let result {
                    Section { Label("Geplaatst. Media-id: \(result)", systemImage: "checkmark.circle.fill").foregroundStyle(.green) }
                }
                if let error {
                    Section { Text(error).foregroundStyle(.red).font(.callout) }
                }
            }
            .navigationTitle("Posten")
        }
    }

    private func publish() async {
        publishing = true
        error = nil
        result = nil
        defer { publishing = false }
        do {
            let id = try await state.client.publishStory(
                imageUrl: mediaType == .image ? url : nil,
                videoUrl: mediaType == .video ? url : nil
            )
            result = id
            url = ""
        } catch {
            self.error = error.localizedDescription
        }
    }
}
