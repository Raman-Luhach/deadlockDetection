export interface DetectionResult {
  is_deadlocked: boolean
  deadlocked_processes: number[]
  safe_sequence: number[]
  safe_sequence_length: number
}

export interface StepState {
  work: number[]
  finish: boolean[]
  safe_sequence: number[]
}

export interface StepResponse {
  status: 'found' | 'done' | 'deadlock'
  selected_process: number | null
  explanation: string
  step_state: StepState
  deadlocked_processes?: number[]
}

export interface SimulateResponse {
  granted: boolean
  is_safe: boolean
  message: string
}

export interface ResolveResponse {
  state: {
    num_processes: number
    num_resources: number
    available: number[]
    allocation: number[][]
    max_need: number[][]
  }
  result: DetectionResult
  victim_process: number
}
