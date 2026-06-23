import SwiftUI

struct InboxView: View {
    @EnvironmentObject var state: AppState

    @State private var conversations: [Conversation] = []
    @State private var loading = false
    @State private var error: String?

    var body: some View {
        NavigationStack {
            Group {
                if conversations.isEmpty && !loading {
                    ContentUnavailableView(
                        "Geen berichten",
                        systemImage: "tray",
                        description: Text("Je vangt alleen nieuwe inkomende DM's op vanaf het moment dat de webhook draait. Bestaande historie komt niet binnen.")
                    )
                } else {
                    List(conversations) { convo in
                        NavigationLink(value: convo.userId) {
                            ConversationRow(convo: convo)
                        }
                    }
                }
            }
            .overlay { if loading { ProgressView() } }
            .navigationTitle("Inbox")
            .navigationDestination(for: String.self) { userId in
                if let convo = conversations.first(where: { $0.userId == userId }) {
                    ConversationView(conversation: convo, onSent: { Task { await load() } })
                        .environmentObject(state)
                }
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
        do { conversations = try await state.client.conversations() }
        catch { self.error = error.localizedDescription }
    }
}

struct ConversationRow: View {
    let convo: Conversation
    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            HStack {
                Text(convo.userId).font(.subheadline).bold().lineLimit(1)
                Spacer()
                if !convo.canReply {
                    Text("venster gesloten")
                        .font(.caption2)
                        .padding(.horizontal, 6).padding(.vertical, 2)
                        .background(.quaternary, in: Capsule())
                }
            }
            Text(convo.lastText).font(.caption).foregroundStyle(.secondary).lineLimit(1)
        }
    }
}

struct ConversationView: View {
    @EnvironmentObject var state: AppState
    let conversation: Conversation
    var onSent: () -> Void

    @State private var draft = ""
    @State private var sending = false
    @State private var error: String?

    var body: some View {
        VStack(spacing: 0) {
            ScrollView {
                VStack(alignment: .leading, spacing: 8) {
                    ForEach(conversation.messages) { msg in
                        MessageBubble(message: msg)
                    }
                }
                .padding()
            }

            Divider()

            if conversation.canReply {
                HStack {
                    TextField("Antwoord…", text: $draft, axis: .vertical)
                        .textFieldStyle(.roundedBorder)
                    Button {
                        Task { await send() }
                    } label: {
                        if sending { ProgressView() } else { Image(systemName: "paperplane.fill") }
                    }
                    .disabled(draft.isEmpty || sending)
                }
                .padding()
            } else {
                Text("Het 24-uurs antwoordvenster is verstreken. Vrij antwoorden kan niet meer.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .padding()
            }
        }
        .navigationTitle(conversation.userId)
        .navigationBarTitleDisplayMode(.inline)
        .alert("Fout", isPresented: .constant(error != nil)) {
            Button("OK") { error = nil }
        } message: { Text(error ?? "") }
    }

    private func send() async {
        sending = true
        error = nil
        defer { sending = false }
        do {
            try await state.client.reply(to: conversation.userId, text: draft)
            draft = ""
            onSent()
        } catch {
            self.error = error.localizedDescription
        }
    }
}

struct MessageBubble: View {
    let message: Message
    var body: some View {
        HStack {
            if !message.isInbound { Spacer(minLength: 40) }
            Text(message.text)
                .padding(10)
                .background(message.isInbound ? Color(.secondarySystemBackground) : Color.accentColor.opacity(0.85))
                .foregroundStyle(message.isInbound ? .primary : .white)
                .clipShape(RoundedRectangle(cornerRadius: 14))
            if message.isInbound { Spacer(minLength: 40) }
        }
    }
}
