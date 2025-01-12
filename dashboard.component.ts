import { Component, OnInit } from '@angular/core';
import { BubbleDataPoint, Chart, ChartConfiguration, ChartTypeRegistry, LegendItem, Point, registerables } from 'chart.js';
import { EmployeeSkill } from '../../Model/employee-skill.module';
import { EmployeeSkillService } from '../../Service/employee-skill.service';
import { Domaine, Niveau } from '../competence/competence-enum';
import { UserService } from '../../Service/user.service';
import { AuthService } from '../../Service/auth.service';
import { User } from '../../Model/user.model';
import { ChartOptions } from 'chart.js/auto';
import { EmployeeTraining } from '../../Model/employee-training.model';
import { EmployeeTrainingService } from '../../Service/employee-training.service';
import { Avancement } from '../formation/formation-enum';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';



@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FormsModule,CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  skills: EmployeeSkill[] = [];
  trainings: EmployeeTraining[] = [];
  userId!: number;


  constructor(
    private skillService: EmployeeSkillService,
    private userService: UserService,
    private authService: AuthService,
    private employeeTrainingService : EmployeeTrainingService,
    private route: ActivatedRoute 
  ) {}

  ngOnInit(): void {
    Chart.register(...registerables);
    this.route.paramMap.subscribe(params => {
        const userIdFromParams = params.get('id');
        if (userIdFromParams) {
            this.userId = +userIdFromParams; // Utilisez l'ID de l'URL
            this.initializeUserDetails();
        } else {
            this.fetchUserDetailsFromAuthService(); // Si aucun ID n'est fourni, récupérez celui de l'utilisateur connecté
        }
    });
}

fetchUserDetailsFromAuthService(): void {
    const userDetails = this.authService.getUserDetails();
    if (userDetails && userDetails.username) {
        this.userService.getUserByUsername(userDetails.username).subscribe(
            (user: User | null) => {
                if (user) {
                    this.userId = user.matricule;
                    this.initializeUserDetails();
                } else {
                    console.error('User NOT found');
                }
            },
            (error) => {
                console.error('Error while fetching user:', error);
            }
        );
    } else {
        console.error('Username not found');
    }
}

initializeUserDetails(): void {
    this.fetchUserSkills();
    this.fetchUserTrainings();
}

fetchUserSkills(): void {
  if (this.userId) {
    this.getAllUserSkills();
  } else {
    console.error('User ID is not set');
  }
}


getAllUserSkills(): void {
  this.skillService.getAllUserSkills(this.userId).subscribe(
    (data: any[]) => {
      this.skills = data.map(item => item.skill); // Suppose 'item.skill' is the correct structure
      this.renderCharts();
    },
    (error) => {
      console.error('Error while fetching user skills:', error);
    }
  );
}

  renderCharts(): void {
 
    this.renderBarChart();

  }

  renderBarChart(): void {
    if (!this.userId) {
        console.error('User ID is null.');
        return;
    }

    this.skillService.getAllUserSkills(this.userId).subscribe(
        (userSkills: EmployeeSkill[]) => {
            if (!userSkills || userSkills.length === 0) {
                console.warn('No skills found for the user.');
                return;
            }

            const labels: string[] = [];
            const dataValues: number[] = [];
            const backgroundColors: string[] = [];
            const colorMapping: { [key: string]: string } = {
                'Débutant': 'rgba(173, 216, 230, 0.8)', 
                'Intermédiaire': 'rgba(152, 251, 152, 0.8)', 
                'Avancé': 'rgba(255, 228, 196, 0.8)', 
              
            };

            userSkills.forEach((skill) => {
                const skillName = skill['skill'].nom_compétence;
                const skillLevel = skill['skill'].niveau as Niveau;
                labels.push(skillName);
                dataValues.push(Object.values(Niveau).indexOf(skillLevel) + 1);
                backgroundColors.push(colorMapping[skillLevel]);
            });

            const datasets = [{
                label: 'Niveau',
                data: dataValues,
                backgroundColor: backgroundColors,
                barThickness: 30, 
            }];

            const data = {
                labels: labels,
                datasets: datasets,
            };

            const options: ChartOptions = {
                plugins: {
                    title: {
                        display: true,
                        text: 'Mes compétences',
                        position: 'bottom',
                        font: {
                            size: 18
                        }
                    },
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            generateLabels: (chart: Chart<keyof ChartTypeRegistry, (number | [number, number] | Point | BubbleDataPoint | null)[], unknown>) => {
                                const legendLabels: LegendItem[] = [];
                                Object.keys(colorMapping).forEach((level, index) => {
                                    legendLabels.push({
                                        text: level,
                                        fillStyle: colorMapping[level],
                                        hidden: false,
                                        index: index,
                                    });
                                });
                                return legendLabels;
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (tooltipItem: any) => {
                                const skillIndex = tooltipItem.dataIndex;
                                const skillName = labels[skillIndex];
                                const skillLevel = dataValues[skillIndex];
                                return `Niveau : ${Object.keys(Niveau)[skillLevel - 1]}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Nom compétence'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Niveau'
                        },
                        ticks: {
                            callback: (value: string | number) => {
                                if (typeof value === 'number') {
                                    return Object.values(Niveau)[value - 1];
                                }
                                return value;
                            },
                            stepSize: 1,
                        },
                    },
                },
            };

            this.createChart('barChart', 'bar', data, options);
        },
        (error) => {
            console.error('An error occurred while fetching user skills:', error);
        }
    );
}

 

  private chartInstances: { [key: string]: Chart } = {};

  createChart(canvasId: string, type: keyof ChartTypeRegistry, data: ChartConfiguration['data'], options?: ChartOptions): void {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) {
      console.error('Canvas element not found:', canvasId);
      return;
    }
    const ctx = canvas.getContext('2d');
  
    if (!ctx) {
      console.error('Unable to get 2D context for canvas.');
      return;
    }

   
    if (this.chartInstances[canvasId]) {
      this.chartInstances[canvasId].destroy();
    }


    this.chartInstances[canvasId] = new Chart(ctx, {
      type: type,
      data: data,
      options: options 
    });
}

fetchUserTrainings(): void {
  if (this.userId) {
    this.getAllUserTrainings();
  } else {
    console.error('User ID is not set');
  }
}

// getAllUserTrainings(): void
getAllUserTrainings(): void {
  this.employeeTrainingService.getAllUserTrainings(this.userId).subscribe(
    (data: any[]) => {
      // Filter trainings to include only those with status 'Approuvé'
      this.trainings = data.filter(training => training.status === 'Approuvé');
      this.renderTrainingAdvancementChart();
      console.log(this.trainings); // Debugging log
    },
    (error) => {
      console.error('Error while fetching user trainings', error);
    }
  );
}
  
renderTrainingAdvancementChart(): void {
  console.log("Processing trainings:", this.trainings); // Log the full list of trainings

  // Define a mapping of avancement to specific colors
  const avancementColorMap: Record<string, string> = {
    'Planifié': 'rgba(204, 204, 255, 0.8)',   // Light Purple
    'En_Cours': 'rgba(204, 255, 204, 0.8)',     // Light Green
    'Terminé': 'rgba(255, 204, 204, 0.8)',   // Light Red
   
  };

  const avancementCounts = this.trainings.reduce((acc, training) => {
    console.log("Current training item:", training); // Log each training item to inspect structure
    const avancement = training['training'].avancement || 'Unknown'; // Accessing 'avancement' correctly
    console.log("Avancement found:", avancement); // Log the found or default 'avancement'
    acc[avancement] = (acc[avancement] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const labels = Object.keys(avancementCounts);
  const dataValues = Object.values(avancementCounts);
  const backgroundColors = labels.map(label => avancementColorMap[label] || 'rgba(192, 192, 192, 0.8)'); // Default to gray if not found

  const data = {
    labels: labels,
    datasets: [{
      label: 'Nombre de formations',
      data: dataValues,
      backgroundColor: backgroundColors,
    }]
  };

  const options: ChartOptions = {
    
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Mes Formations',
        position: 'bottom',
        font: {
          size: 18
        }
      }
    }
  };

  this.createChart('trainingAvancementChart', 'doughnut', data, options);
}
}