import SwiftUI

struct RootView: View {
    @EnvironmentObject var state: AppState

    var body: some View {
        TabView {
            PostStoryView()
                .tabItem { Label("Posten", systemImage: "plus.square.on.square") }

            InsightsView()
                .tabItem { Label("Prestaties", systemImage: "chart.bar") }

            InboxView()
                .tabItem { Label("Inbox", systemImage: "tray") }

            SettingsView()
                .tabItem { Label("Instellingen", systemImage: "gearshape") }
        }
        .task { await state.refreshStatus() }
    }
}
