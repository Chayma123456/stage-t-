import { Component, OnInit, inject } from '@angular/core';
import { AuthService } from '../../Service/auth.service';
import { Router } from '@angular/router';



@Component({
  selector: 'app-home',
  standalone: true,
  imports: [],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent  implements OnInit{
  constructor(private authService: AuthService, private router: Router) { }

  ngOnInit(): void {
    const allowedRoles = ['admin', 'employee']; // Define roles allowed to access this component
    const userRole = this.authService.getUserRole(); // Get user role from AuthService

    // Check if the user is authenticated and their role is allowed
    if (!this.authService.isLoggedIn() /*|| !allowedRoles.includes(userRole)*/) {
      this.router.navigate(['/']);
    }
  }

 



}