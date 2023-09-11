package migrations

import (
	"log"

	"github.com/dataplane-app/dataplane/app/mainapp/database/models"
	"gorm.io/gorm"
)

func SpecificMigrations(dbConn *gorm.DB, migrateVersion string) {

	// ----- Specific migrations -----
	log.Println("🤖 Running specific migrations")

	// ---- NEW specific migration model ----

	var migrationsMap = make(map[string]bool)
	var migrationKey string = ""

	var dbMigration []models.DatabaseMigrations
	dbConn.Where("completed = ?", true).Find(&dbMigration)

	for _, m := range dbMigration {
		migrationsMap[m.MigrationKey] = m.Completed
	}

	// Migration of API keys to avoid the secret to be exposed and use an ID instead
	// Used as an example, too few users to justify risk of using this migration, released as a breaking change instead.
	migrationKey = "apikeys"
	_, ok := migrationsMap[migrationKey]

	// If the key does not exist then perform the migration
	if ok == false {

		// Wrap the migration into a transaction

		errmigrate := dbConn.Transaction(func(tx *gorm.DB) error {

			if err := tx.Create(&models.DatabaseMigrations{
				MigrationKey:     migrationKey,
				Completed:        true,
				MigrationVersion: migrateVersion,
			}).Error; err != nil {
				log.Println("Could not register migration for key: "+migrationKey, err)
				return err
			}
			// return nil will commit the whole transaction
			return nil
		})

		if errmigrate != nil {
			panic("Could register specific migration for key: " + migrationKey)
		}
	}

	/* To remove old permission values for deployments - caused an issue with checking and available permissions in drop down */
	migrationKey = "old_deploy_permission"
	_, ok = migrationsMap[migrationKey]
	// If the key does not exist then perform the migration
	if ok == false {

		errmigrate := dbConn.Transaction(func(tx *gorm.DB) error {

			if err := tx.Debug().Where("code in (?, ?)", "environment_deploy_here", "environment_deploy_all_pipelines").Delete(&models.ResourceTypeStruct{}).Error; err != nil {
				log.Println("Could not register migration for key: "+migrationKey, err)
				return err
			}
			// return nil will commit the whole transaction
			return nil
		})

		if errmigrate != nil {
			panic("Could register specific migration for key: " + migrationKey)
		}

	}

	/* To remove unique constraints on api triggers which causes an issue where the same deployments to different environments canr be added */
	migrationKey = "remove_deploy_uniqueconstraint_api"
	_, ok = migrationsMap[migrationKey]
	// If the key does not exist then perform the migration
	if ok == false {

		errmigrate := dbConn.Transaction(func(tx *gorm.DB) error {

			if err := tx.Debug().Exec("drop index if exists idx_deploymentid_api_trigger;").Error; err != nil {
				log.Println("Could not register migration for key: "+migrationKey, err)
				return err
			}

			if err := tx.Debug().Exec("alter table deployment_api_triggers DROP CONSTRAINT IF EXISTS idx_deployment_api_triggers_deployment_id;").Error; err != nil {
				log.Println("Could not register migration for key: "+migrationKey, err)
				return err
			}

			if err := tx.Debug().Exec("CREATE UNIQUE INDEX IF NOT EXISTS idx2_deploymentid_api_trigger on deployment_api_triggers (deployment_id, environment_id);").Error; err != nil {
				log.Println("Could not register migration for key: "+migrationKey, err)
				return err
			}

			// return nil will commit the whole transaction
			return nil
		})

		if errmigrate != nil {
			panic("Could register specific migration for key: " + migrationKey)
		}

	}

}
