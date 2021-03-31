import { Component } from '@angular/core';
import { DatabaseService } from './../Services/database.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

    result=[];

  constructor(private dbService:DatabaseService) {
    this.loadProducts();
  }
  loadProducts(){
    this.dbService.getProductList().subscribe((data)=>{
      this.result = data.values;
      console.log('employees: ',this.result);
    })
  }

}
