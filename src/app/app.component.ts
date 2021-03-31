import { Component } from '@angular/core';
import { Platform, LoadingController } from '@ionic/angular';
import { DatabaseService } from './Services/database.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  constructor(
    private platform: Platform,
    private databaseService: DatabaseService,
    private loadingCtrl: LoadingController
  ) {
    this.initializeApp();
  }

  async initializeApp() {
    this.platform.ready().then(async () => {
      const loading = await this.loadingCtrl.create();
      await loading.present();
      this.databaseService.init();
      this.databaseService.dbReady.subscribe((isReady) => {
        if (isReady) {
          loading.dismiss();
          //this.statusBar.styleDefault();
          //this.splashScreen.hide();
        }
      });
    });
  }
}
