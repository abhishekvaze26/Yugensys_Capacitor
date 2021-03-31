import { Injectable } from '@angular/core';
import { Plugins } from '@capacitor/core';
import '@capacitor-community/sqlite';
import { AlertController } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, from, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { JsonSQLite } from '@capacitor-community/sqlite';
const { CapacitorSQLite, Device, Storage } = Plugins;

const DB_SETUP_KEY = 'first_db_setup';
const DB_NAME_KEY = 'db_name';

@Injectable({
  providedIn: 'root',
})
export class DatabaseService {
  dbReady = new BehaviorSubject(false);
  dbName = '';

  constructor(private http: HttpClient, private alertCtrl: AlertController) {}

  async init(): Promise<void> {
    console.log('inside init()');
    const info = await Device.getInfo();

    if (info.platform === 'android') {
      try {
        const sqlite = CapacitorSQLite as any;
        await sqlite.requestPermissions();
        this.setupDatabase();
      } catch (e) {
        const alert = await this.alertCtrl.create({
          header: 'No DB access',
          message: "This app can't work without Database access.",
          buttons: ['OK'],
        });
        await alert.present();
      }
    } else {
      this.setupDatabase();
    }
  }

  private async setupDatabase() {
    console.log('inside setupDatabase');
    const dbSetupDone = await Storage.get({ key: DB_SETUP_KEY });
    console.log('database setup done : ',dbSetupDone);
    if (!dbSetupDone.value) {
      console.log('about to download database');
      this.downloadDatabase();
    } else {
      console.log('continue without download');
      // this.dbName = (await Storage.get({ key: DB_NAME_KEY })).value;
      // await CapacitorSQLite.open({ database: this.dbName });
      // this.dbReady.next(true);
      this.downloadDatabase();
    }
  }

  private downloadDatabase(update = false) {
    console.log('inside downloadDatabase');
    this.http
      .get('assets/seed-db.json')
      .subscribe(async (jsonExport: JsonSQLite) => {
        const jsonstring = JSON.stringify(jsonExport);
        const isValid = await CapacitorSQLite.isJsonValid({ jsonstring });

        if (isValid.result) {
          this.dbName = jsonExport.database;
          await Storage.set({ key: DB_NAME_KEY, value: this.dbName });
          await CapacitorSQLite.importFromJson({ jsonstring });
          await Storage.set({ key: DB_SETUP_KEY, value: '1' });
          CapacitorSQLite.createConnection({ database: this.dbName });
          CapacitorSQLite.open({ database: this.dbName });

          // Your potential logic to detect offline changes later
          if (!update) {
            await CapacitorSQLite.createSyncTable({ database: this.dbName });
          } else {
            await CapacitorSQLite.setSyncDate({
              syncdate: '' + new Date().getTime(),
            });
          }
          this.dbReady.next(true);
        }
      });
  }

  getProductList() {
    console.log('inside getProductList');
    return this.dbReady.pipe(
      switchMap((isReady) => {
        if (!isReady) {
          return of({ values: [] });
        } else {
          const statement =
            'SELECT Employee.e_id,Employee.e_name,Employee.e_salary,Employee.d_Id,Department.d_name from Employee inner join Department using(d_id) group by d_name,e_salary order by e_salary DESC;';
          return from(
            CapacitorSQLite.query({
              statement,
              values: [],
              database: this.dbName,
            })
          );
        }
      })
    );
  }
}
