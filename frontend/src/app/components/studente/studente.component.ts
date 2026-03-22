import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { GradeService } from '../../services/grade.service';
import { Grade } from '../../models/grade';

@Component({
  selector: 'app-studente',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './studente.component.html',
  styleUrl: './studente.component.css',
})
export class StudenteComponent implements OnInit {
  private readonly gradeService = inject(GradeService);
  readonly authService = inject(AuthService);

  grades: Grade[] = [];
  loading = false;
  error = '';
  average = computed(() => {
    if (!this.grades.length) {
      return 0;
    }
    const total = this.grades.reduce((sum, grade) => sum + Number(grade.voto), 0);
    return Number((total / this.grades.length).toFixed(2));
  });

  ngOnInit(): void {
    this.loading = true;
    this.gradeService.getMyGrades().subscribe({
      next: (grades) => {
        this.grades = grades;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.error || 'Impossibile caricare i tuoi voti.';
        this.loading = false;
      },
    });
  }
}
