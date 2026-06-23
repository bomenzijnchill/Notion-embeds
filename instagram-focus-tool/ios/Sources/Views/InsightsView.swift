import SwiftUI

struct InsightsView: View {
    @EnvironmentObject var state: AppState

    @State private var stories: [Story] = []
    @State private var loading = false
    @State private var error: String?

    var body: some View {
        NavigationStack {
            Group {
                if stories.isEmpty && !loading {
                    ContentUnavailableView(
                        "Geen actieve stories",
                        systemImage: "chart.bar",
                        description: Text("Stories zijn maximaal 24 uur zichtbaar. Plaats er een en kom terug voor de prestaties.")
                    )
                } else {
                    List(stories) { story in
                        NavigationLink(value: story.id) {
                            StoryRow(story: story)
                        }
                    }
                }
            }
            .overlay { if loading { ProgressView() } }
            .navigationTitle("Prestaties")
            .navigationDestination(for: String.self) { mediaId in
                StoryInsightDetail(mediaId: mediaId)
                    .environmentObject(state)
            }
            .toolbar {
                Button { Task { await load() } } label: { Image(systemName: "arrow.clockwise") }
            }
            .task { await load() }
            .alert("Fout", isPresented: .constant(error != nil)) {
                Button("OK") { error = nil }
            } message: { Text(error ?? "") }
        }
    }

    private func load() async {
        loading = true
        defer { loading = false }
        do { stories = try await state.client.stories() }
        catch { self.error = error.localizedDescription }
    }
}

struct StoryRow: View {
    let story: Story
    var body: some View {
        HStack {
            Image(systemName: story.mediaType == "VIDEO" ? "play.rectangle" : "photo")
                .foregroundStyle(.secondary)
            VStack(alignment: .leading) {
                Text(story.mediaType ?? "STORY").font(.subheadline)
                if let ts = story.timestamp {
                    Text(ts).font(.caption).foregroundStyle(.secondary)
                }
            }
        }
    }
}

struct StoryInsightDetail: View {
    @EnvironmentObject var state: AppState
    let mediaId: String

    @State private var metrics: [InsightMetric] = []
    @State private var loading = false
    @State private var error: String?

    var body: some View {
        List {
            if metrics.isEmpty && !loading {
                Text("Nog geen cijfers beschikbaar.").foregroundStyle(.secondary)
            }
            ForEach(metrics) { m in
                LabeledContent(label(m.name), value: "\(m.firstValue)")
            }
        }
        .overlay { if loading { ProgressView() } }
        .navigationTitle("Story-prestaties")
        .task { await load() }
        .alert("Fout", isPresented: .constant(error != nil)) {
            Button("OK") { error = nil }
        } message: { Text(error ?? "") }
    }

    private func label(_ name: String) -> String {
        switch name {
        case "reach": return "Bereik"
        case "replies": return "Reacties"
        default: return name.capitalized
        }
    }

    private func load() async {
        loading = true
        defer { loading = false }
        do { metrics = try await state.client.insights(mediaId: mediaId) }
        catch { self.error = error.localizedDescription }
    }
}
