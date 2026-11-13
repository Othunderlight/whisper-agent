import Foundation

enum DictationPhase: String {
    case idle
    case active
    case recording
}

struct DictationConstants {
    static let startRecording = "com.ryoikitenkai.startRecording"
    static let stopRecording = "com.ryoikitenkai.stopRecording"
    static let stopDictation = "com.ryoikitenkai.stopDictation"
    static let dictationPhaseChanged = "com.ryoikitenkai.dictationPhaseChanged"

    static let phaseKey = "ryoiki_tenkai_dictation_phase"
    static let startedAtKey = "ryoiki_tenkai_dictation_started_at"
    static let audioLevelKey = "ryoiki_tenkai_audio_level"
    static let heartbeatKey = "ryoiki_tenkai_dictation_heartbeat"
    static let heartbeatStaleThreshold: TimeInterval = 5.0
    static let maxRecordingDuration: TimeInterval = 240.0
    static let idleTimeoutKey = "ryoiki_tenkai_idle_timeout_seconds"
    static let defaultIdleTimeout: TimeInterval = 120.0

    static let appGroupId = "group.com.ryoikitenkai.mobile"

    static var audioFileURL: URL? {
        FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroupId)?
            .appendingPathComponent("dictation_recording.m4a")
    }
}
