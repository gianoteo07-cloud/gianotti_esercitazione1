export interface Grade {
  id?: number;
  studente_username: string;
  studente_nome: string;
  materia: string;
  voto: number;
  created_at?: string;
}

export interface GradePayload {
  studenteUsername: string;
  studenteNome: string;
  materia: string;
  voto: number;
}
