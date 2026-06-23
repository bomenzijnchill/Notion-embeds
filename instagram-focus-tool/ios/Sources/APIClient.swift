import Foundation

// Praat met de Node-backend. Base-URL en API-sleutel komen uit Instellingen
// (UserDefaults), zodat je ze in de app kunt invullen zonder te hercompileren.
enum APIError: LocalizedError {
    case notConfigured
    case server(String)
    case decoding

    var errorDescription: String? {
        switch self {
        case .notConfigured: return "Stel eerst de server-URL en API-sleutel in onder Instellingen."
        case .server(let m): return m
        case .decoding: return "Kon het antwoord van de server niet lezen."
        }
    }
}

struct APIClient {
    var baseURL: String
    var apiKey: String

    static var fromDefaults: APIClient {
        let d = UserDefaults.standard
        return APIClient(
            baseURL: d.string(forKey: "baseURL") ?? "",
            apiKey: d.string(forKey: "apiKey") ?? ""
        )
    }

    private func request(_ path: String, method: String = "GET", body: [String: Any]? = nil) async throws -> Data {
        guard !baseURL.isEmpty, let url = URL(string: baseURL.trimmingCharacters(in: .whitespaces) + path) else {
            throw APIError.notConfigured
        }
        var req = URLRequest(url: url)
        req.httpMethod = method
        req.setValue(apiKey, forHTTPHeaderField: "x-api-key")
        if let body {
            req.setValue("application/json", forHTTPHeaderField: "Content-Type")
            req.httpBody = try JSONSerialization.data(withJSONObject: body)
        }
        let (data, resp) = try await URLSession.shared.data(for: req)
        guard let http = resp as? HTTPURLResponse else { throw APIError.server("Geen HTTP-antwoord.") }
        if !(200...299).contains(http.statusCode) {
            // Probeer de foutmelding uit de body te halen.
            if let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               let msg = obj["error"] as? String {
                throw APIError.server(msg)
            }
            throw APIError.server("Serverfout \(http.statusCode).")
        }
        return data
    }

    private func decode<T: Decodable>(_ data: Data) throws -> T {
        do { return try JSONDecoder().decode(T.self, from: data) }
        catch { throw APIError.decoding }
    }

    func status() async throws -> StatusResponse {
        try decode(try await request("/api/status"))
    }

    func conversations() async throws -> [Conversation] {
        let r: ConversationsResponse = try decode(try await request("/api/conversations"))
        return r.conversations
    }

    func reply(to userId: String, text: String) async throws {
        _ = try await request("/api/conversations/\(userId)/reply", method: "POST", body: ["text": text])
    }

    func stories() async throws -> [Story] {
        let r: StoriesResponse = try decode(try await request("/api/stories"))
        return r.stories
    }

    func insights(mediaId: String) async throws -> [InsightMetric] {
        let r: InsightsResponse = try decode(try await request("/api/stories/\(mediaId)/insights"))
        return r.data
    }

    func publishStory(imageUrl: String?, videoUrl: String?) async throws -> String {
        var body: [String: Any] = [:]
        if let imageUrl, !imageUrl.isEmpty { body["imageUrl"] = imageUrl }
        if let videoUrl, !videoUrl.isEmpty { body["videoUrl"] = videoUrl }
        let r: PublishResponse = try decode(try await request("/api/stories/publish", method: "POST", body: body))
        if let id = r.id { return id }
        throw APIError.server(r.error ?? "Publiceren mislukt.")
    }
}
