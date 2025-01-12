import { Component, OnInit } from '@angular/core';
import { Chart, ChartConfiguration, ChartData, ChartItem, ChartType, ChartTypeRegistry, registerables } from 'chart.js';
import { EmployeeSkill } from '../../Model/employee-skill.module';
import { EmployeeSkillService } from '../../Service/employee-skill.service';
import { Domaine, Niveau } from '../competence/competence-enum';
import { ChartOptions } from 'chart.js/auto';
import { AuthService } from '../../Service/auth.service';
import { UserService } from '../../Service/user.service';
import { User } from '../../Model/user.model';
import { forkJoin, map } from 'rxjs';
import { EmployeeTraining } from '../../Model/employee-training.model';
import { EmployeeTrainingService } from '../../Service/employee-training.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard-equipe',
  standalone: true,
  imports: [FormsModule,CommonModule],
  templateUrl: './dashboard-equipe.component.html',
  styleUrl: './dashboard-equipe.component.scss'
})
export class DashboardEquipeComponent implements OnInit {

   userId!: number ;
   nom_equipe!:string;
   public barChartType: ChartType = 'bar'; 
   teamMembersTrainings: { user: User, trainings: EmployeeTraining[] }[] = [];
   

  

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private employeeTrainingService : EmployeeTrainingService
  ) {}

  ngOnInit(): void {
    Chart.register(...registerables);
    this.fetchUserAndTeamData();
  }

  fetchUserAndTeamData(): void {
    const userDetails = this.authService.getUserDetails();
    if (userDetails && userDetails.username) {
      this.userService.getUserByUsername(userDetails.username).subscribe(user => {
        if (user) {
          this.userId = user.matricule;
          this.nom_equipe = user.nom_equipe;
          this.userService.getEmployeesByTeam(user.nom_equipe).subscribe(teamMembers => {
            if (teamMembers && teamMembers.length > 0) {
              this.fetchAllTrainings(teamMembers);
              this.renderChart(teamMembers);
            } else {
              console.error('No team members found for:', user.nom_equipe);
            }
          });
        } else {
          console.error('User details not found for:', userDetails.username);
        }
      });
    } else {
      console.error('User details are incomplete or missing');
    }
  }

  fetchAllTrainings(teamMembers: User[]): void {
    const trainingObservables = teamMembers.map(member =>
      this.employeeTrainingService.getAllUserTrainings(member.matricule).pipe(
        map(trainings => ({
          user: member,
          trainings: trainings
        }))
      )
    );
  
    forkJoin(trainingObservables).subscribe(results => {
      console.log("Fetched Trainings: ", results); // Check what is being fetched
      this.teamMembersTrainings = results;
    }, error => {
      console.error('Error fetching trainings: ', error);
    });
  }

  getAllTrainingNames(): string[] {
    const allTrainingNames = new Set<string>();
    this.teamMembersTrainings.forEach(member => {
        member.trainings.forEach(training => {
            console.log("Training Object for Name Extraction:", training);
            allTrainingNames.add(training['training'].nom_formation);  // Adjust according to actual structure
        });
    });
    return Array.from(allTrainingNames);
}
getTrainingProgress(trainings: EmployeeTraining[], trainingName: string): string {
  console.log("Trainings for Progress Check:", trainings);
  const training = trainings.find(t => t['training'].nom_formation === trainingName);  // Adjust according to actual structure
  console.log("Found Training for Progress:", training);
  return training ? training['training'].avancement : '_';  
}

renderChart(teamMembers: User[]): void {
  const colorPalette = ['#FFB6C1', '#FFDAB9', '#B0E0E6', '#F0E68C', '#D8BFD8'];

  const barChartData: ChartData<'bar'> = {
    labels: teamMembers.map(member => `${member.username}`),
    datasets: [{
      data: teamMembers.map(member => member.grade),
      backgroundColor: colorPalette, // Use the color palette
      borderColor: colorPalette, // Use the same color palette for borders
      borderWidth: 1,
      barThickness: 40 // Makes bars thicker
    }]
  };
  this.updateChart(barChartData);
}



  updateChart(barChartData: ChartData<'bar'>): void {
    const canvas = document.getElementById('teamChart') as HTMLCanvasElement;
    if (!canvas) {
      console.error('Canvas element not found');
      return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Failed to get 2D context');
      return;
    }
    
    const barChartOptions: ChartOptions = {
      responsive: true,
      plugins: {
        legend: {
          display: false, 
        },
    title: {
      display: true,
      text: "Distriribution des collaborateurrs par grade", 
      position: 'top',
      padding:10,
      font: {
        size: 16
    }
     
    }
      },
      scales: {
        x: {
          ticks: {
            maxRotation: 0,
            minRotation: 0,
            autoSkip: false,  // Ensure all labels are shown
            padding: 0  // Reduces or removes padding between labels
          },
          grid: {
            display: false  // Optionally hide the grid lines for x-axis
          }
        },
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          },
          title: {
            display: true,
            text: 'Grades'
          },
          
        }
      }
    };

    // Set properties to make bars as thin as possible
    barChartData.datasets.forEach(dataset => {
        dataset.barThickness = 20;  // Set a small fixed value
        dataset.maxBarThickness = 20;  // Ensures bars do not exceed this thickness
        dataset.categoryPercentage = 0.2;  // Reduce the width of each category's allotted space
        dataset.barPercentage = 0.1;  // Bars use up only a small percentage of each category's width
    });

    new Chart(ctx as ChartItem, {
      type: this.barChartType,
      data: barChartData,
      options: barChartOptions
    });
}
}