import Foundation

// Antwoord van GET /api/status
struct StatusResponse: Codable {
    let connected: Bool
    let userId: String?
    let tokenExpiresAt: Double?   // ms sinds epoch
    let tokenUpdatedAt: Double?

    var tokenExpiryDate: Date? {
        guard let ms = tokenExpiresAt else { return nil }
        return Date(timeIntervalSince1970: ms / 1000)
    }
}

// Eén DM binnen een gesprek
struct Message: Codable, Identifiable {
    var id: String { "\(userId)-\(timestamp)-\(direction)" }
    let userId: String
    let direction: String   // "in" of "out"
    let text: String
    let timestamp: Double

    var isInbound: Bool { direction == "in" }
    var date: Date { Date(timeIntervalSince1970: timestamp / 1000) }
}

// Een gesprek met één persoon
struct Conversation: Codable, Identifiable {
    var id: String { userId }
    let userId: String
    let messages: [Message]
    let lastMessageAt: Double
    let lastText: String
    let canReply: Bool
    let canReplyUntil: Double

    var canReplyUntilDate: Date { Date(timeIntervalSince1970: canReplyUntil / 1000) }
}

struct ConversationsResponse: Codable {
    let conversations: [Conversation]
}

// Een actieve story
struct Story: Codable, Identifiable {
    let id: String
    let mediaType: String?
    let mediaUrl: String?
    let thumbnailUrl: String?
    let permalink: String?
    let timestamp: String?

    enum CodingKeys: String, CodingKey {
        case id
        case mediaType = "media_type"
        case mediaUrl = "media_url"
        case thumbnailUrl = "thumbnail_url"
        case permalink, timestamp
    }
}

struct StoriesResponse: Codable {
    let stories: [Story]
}

// Insights-antwoord: { data: [ { name, values: [ { value } ] } ] }
struct InsightsResponse: Codable {
    let data: [InsightMetric]
}

struct InsightMetric: Codable, Identifiable {
    var id: String { name }
    let name: String
    let values: [InsightValue]

    var firstValue: Int { values.first?.value ?? 0 }
}

struct InsightValue: Codable {
    let value: Int
}

struct PublishResponse: Codable {
    let id: String?
    let error: String?
}
