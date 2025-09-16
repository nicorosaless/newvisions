// Central API layer between frontend and backend FastAPI (`backend/api.py`).
// Provides typed wrappers, error handling, abort controllers, and future auth token attachment.

// -----------------------------
// Configuration
// -----------------------------
// Compute a robust default base URL. Prefer VITE_API_BASE_URL when provided,
// and ensure it includes the '/api' prefix. In dev, fall back to same-origin '/api'.
function computeBaseUrl(): string {
	const raw = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined;
	let base = raw && raw.trim().length ? raw.trim() : '/api';
	try {
		const u = new URL(base, typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173');
		// Ensure pathname ends with '/api' (either exact '/api' or '/something/api')
		if (!u.pathname.match(/\/?api\/?$/)) {
			// If base had no path or a different path, append '/api'
			u.pathname = (u.pathname.replace(/\/$/, '')) + '/api';
		}
		// Remove trailing slash for consistency
		return u.toString().replace(/\/$/, '');
	} catch {
		// If not a valid URL, treat as relative and normalize
		if (!base.startsWith('/')) base = '/' + base;
		if (!base.endsWith('/api')) base = base.replace(/\/$/, '') + '/api';
		return base;
	}
}

const DEFAULT_BASE_URL = computeBaseUrl();

export interface ApiClientOptions {
	baseUrl?: string;
	getAuthToken?: () => string | null; // future JWT retrieval
	timeoutMs?: number; // per-request timeout
}

export interface ThoughtRequest {
	topic: string;
	value: string;
}
export interface ThoughtResponse { thought: string }

export interface AudioRequest {
	topic: string;
	value: string;
}
export interface AudioResponse {
	audio_base64: string;
	text: string;
	filename: string | null;
}

export interface HealthResponse {
	status: string;
	app: string;
	env: string;
	port: number;
	has_google_api_key: boolean;
	has_elevenlabs_api_key: boolean;
}

export interface ElevenLabsStatusResponse {
	// Flexible typing; will refine when backend defines shape explicitly
	[key: string]: any;
}

// Auth models
export interface RegisterRequest {
	username: string;
	email: string;
	password: string;
	activationCode: string;
}
export interface RegisterResponse {
	user_id: string;
	username: string;
	email: string;
}
export interface LoginRequest {
	username: string;
	password: string;
}
export interface LoginResponse {
	user_id: string;
	username: string;
	email: string;
}

export interface UserMetaResponse {
  charCount: number;
  monthlyLimit: number;
}

export interface UserVoiceMetaResponse {
	hasSample: boolean;
	hasClone: boolean;
	voiceCloneId: string | null;
	inPool: boolean;
}

export interface UserVoiceSourceResponse {
	voiceCloneId: string | null;
	hash: string | null;
	duration: number | null;
	audio_base64: string; // MP3 base64 (no data URI)
	mime: string;
}

// Perform models
export interface PerformRequest {
	user_id: string; // backend expects field named user_id
	routine_type: string;
	value: string;
	settings_override?: Partial<UserSettings>;
}
export interface PerformResponse {
	routine_type: string;
	text: string;
	audio_base64: string;
	filename: string;
	charCount: number;
	monthlyLimit: number;
    // Campos adicionales devueltos por backend
    voiceSource?: string;
    charsUsedRaw?: number;
    charsUsedEffective?: number;
}

export interface VoiceUploadResponse { status: string; bytes: number; hash?: string; duration?: number }

// User settings models
export interface UserSettings {
	voice_language: string;
	speaker_sex: string;
	voice_stability: number;
	voice_similarity: number;
	background_sound: boolean;
	background_volume: number;
	voice_note_name?: string | null;
	voice_note_date?: string | null; // YYYY-MM-DD
	voice_note_name_default?: boolean; // if true ignore custom name
}

export type SettingsUpdateRequest = UserSettings; // identical for now

export class ApiError extends Error {
	status: number;
	details: any;
	constructor(message: string, status: number, details: any) {
		super(message);
		this.status = status;
		this.details = details;
	}
}

export class ApiClient {
	private baseUrl: string;
	private getAuthToken?: () => string | null;
	private timeoutMs: number;

	constructor(options: ApiClientOptions = {}) {
		this.baseUrl = (options.baseUrl || DEFAULT_BASE_URL).replace(/\/$/, '');
		this.getAuthToken = options.getAuthToken;
		this.timeoutMs = options.timeoutMs ?? 20000;
	}

	// Low-level request helper
	private async request<T>(path: string, init: RequestInit & { skipAuth?: boolean } = {}): Promise<T> {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
		try {
			const headers: Record<string, string> = {
				'Accept': 'application/json'
			};
			if (init.body && !(init.body instanceof FormData)) {
				headers['Content-Type'] = 'application/json';
			}
			if (!init.skipAuth && this.getAuthToken) {
				const token = this.getAuthToken();
				if (token) headers['Authorization'] = `Bearer ${token}`;
			}

			const res = await fetch(`${this.baseUrl}${path}`, { ...init, headers: { ...headers, ...(init.headers || {}) }, signal: controller.signal });
			const contentType = res.headers.get('content-type') || '';
			let payload: any = null;
			if (contentType.includes('application/json')) {
				payload = await res.json().catch(() => null);
			} else if (contentType.startsWith('text/')) {
				payload = await res.text().catch(() => null);
			}
			if (!res.ok) {
				throw new ApiError(`Request failed: ${res.status}`, res.status, payload);
			}
			return payload as T;
		} catch (err: any) {
			if (err.name === 'AbortError') {
				throw new ApiError('Request timeout', 0, null);
			}
			if (err instanceof ApiError) throw err;
			throw new ApiError(err.message || 'Network error', 0, null);
		} finally {
			clearTimeout(timeout);
		}
	}

	// -----------------------------
	// Public API methods
	// -----------------------------
	health(): Promise<HealthResponse> {
		return this.request<HealthResponse>('/health', { method: 'GET', skipAuth: true });
	}

	generateThought(data: ThoughtRequest): Promise<ThoughtResponse> {
		return this.request<ThoughtResponse>('/generate-thought', {
			method: 'POST',
			body: JSON.stringify(data)
		});
	}

	generateAudio(data: AudioRequest): Promise<AudioResponse> {
		return this.request<AudioResponse>('/generate-audio', {
			method: 'POST',
			body: JSON.stringify(data)
		});
	}

	getAudioFile(filename: string): Promise<Blob> {
		return this.fetchBinary(`/audio/${encodeURIComponent(filename)}`);
	}

	elevenLabsStatus(): Promise<ElevenLabsStatusResponse> {
		return this.request<ElevenLabsStatusResponse>('/providers/elevenlabs/status', { method: 'GET' });
	}

		register(data: RegisterRequest): Promise<RegisterResponse> {
			return this.request<RegisterResponse>('/auth/register', { method: 'POST', body: JSON.stringify(data), skipAuth: true });
		}

		login(data: LoginRequest): Promise<LoginResponse> {
			return this.request<LoginResponse>('/auth/login', { method: 'POST', body: JSON.stringify(data), skipAuth: true });
		}

	updateUserSettings(userId: string, settings: SettingsUpdateRequest): Promise<UserSettings> {
		return this.request<UserSettings>(`/users/${encodeURIComponent(userId)}/settings`, {
			method: 'PUT',
			body: JSON.stringify(settings),
			skipAuth: true // backend no requiere auth todavía para settings
		});
	}

	getUserSettings(userId: string): Promise<UserSettings> {
		return this.request<UserSettings>(`/users/${encodeURIComponent(userId)}/settings`, { method: 'GET', skipAuth: true });
	}

	getUserMeta(userId: string): Promise<UserMetaResponse> {
		return this.request<UserMetaResponse>(`/users/${encodeURIComponent(userId)}/meta`, { method: 'GET', skipAuth: true });
	}


	getUserVoiceMeta(userId: string, opts?: { debug?: boolean }): Promise<UserVoiceMetaResponse> {
		const q = opts?.debug ? '?debug=1' : '';
		return this.request<UserVoiceMetaResponse>(`/users/${encodeURIComponent(userId)}/voice/meta${q}`, { method: 'GET', skipAuth: true });
	}

	// Explicit helper to trigger preperform preparation without caring about payload
	preperformPrepare(userId: string, debug: boolean = false): Promise<UserVoiceMetaResponse> {
		return this.getUserVoiceMeta(userId, { debug });
	}

	materializeUserVoice(userId: string, createIfMissing: boolean = false): Promise<any> {
		const q = createIfMissing ? '?create_if_missing=1' : '';
		return this.request<any>(`/users/${encodeURIComponent(userId)}/voice/materialize${q}`, { method: 'POST', skipAuth: true });
	}

	getUserVoiceSource(userId: string): Promise<UserVoiceSourceResponse> {
		return this.request<UserVoiceSourceResponse>(`/users/${encodeURIComponent(userId)}/voice/source`, { method: 'GET', skipAuth: true });
	}


	perform(data: PerformRequest): Promise<PerformResponse> {
		return this.request<PerformResponse>('/perform', {
			method: 'POST',
			body: JSON.stringify(data),
			skipAuth: true
		});
	}

	uploadUserVoice(userId: string, audioBase64: string, mimeType?: string, durationSeconds?: number, desiredVoiceName?: string): Promise<VoiceUploadResponse> {
		return this.request<VoiceUploadResponse>(`/users/${encodeURIComponent(userId)}/voice`, {
			method: 'POST',
			body: JSON.stringify({ audio_base64: audioBase64, mime_type: mimeType, duration_seconds: durationSeconds, desired_voice_name: desiredVoiceName }),
			skipAuth: true
		});
	}

	// -----------------------------
	// Helpers
	// -----------------------------
	private async fetchBinary(path: string): Promise<Blob> {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
		try {
			const res = await fetch(`${this.baseUrl}${path}`, { method: 'GET', signal: controller.signal });
			if (!res.ok) {
				throw new ApiError(`Binary request failed: ${res.status}`, res.status, null);
			}
			return await res.blob();
		} catch (err: any) {
			if (err.name === 'AbortError') throw new ApiError('Request timeout', 0, null);
			if (err instanceof ApiError) throw err;
			throw new ApiError(err.message || 'Network error', 0, null);
		} finally {
			clearTimeout(timeout);
		}
	}
}

// Default singleton client (can be replaced / mocked in tests)
export const apiClient = new ApiClient();

// Convenience top-level functions (optional usage pattern)
export const fetchHealth = () => apiClient.health();
export const fetchThought = (topic: string, value: string) => apiClient.generateThought({ topic, value });
export const fetchAudio = (topic: string, value: string) => apiClient.generateAudio({ topic, value });
export const fetchAudioFile = (filename: string) => apiClient.getAudioFile(filename);
export const fetchElevenLabsStatus = () => apiClient.elevenLabsStatus();
export const registerUser = (data: RegisterRequest) => apiClient.register(data);
export const loginUser = (data: LoginRequest) => apiClient.login(data);
export const updateUserSettings = (userId: string, settings: SettingsUpdateRequest) => apiClient.updateUserSettings(userId, settings);
export const getUserSettings = (userId: string) => apiClient.getUserSettings(userId);
export const getUserMeta = (userId: string) => apiClient.getUserMeta(userId);
export const preperformPrepare = (userId: string, debug: boolean = false) => apiClient.preperformPrepare(userId, debug);
export const materializeUserVoice = (userId: string, createIfMissing: boolean = false) => apiClient.materializeUserVoice(userId, createIfMissing);
export const performRoutine = (data: PerformRequest) => apiClient.perform(data);
export const uploadUserVoice = (userId: string, audioBase64: string, mimeType?: string, durationSeconds?: number, desiredVoiceName?: string) => apiClient.uploadUserVoice(userId, audioBase64, mimeType, durationSeconds, desiredVoiceName);

// Example usage (remove or adapt in integration phase):
// fetchThought('Movies', 'Inception').then(console.log).catch(console.error);

