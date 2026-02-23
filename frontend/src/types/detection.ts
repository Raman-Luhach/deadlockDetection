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
