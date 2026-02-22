export interface DetectionResult {
  is_deadlocked: boolean
  deadlocked_processes: number[]
  safe_sequence: number[]
  safe_sequence_length: number
}
