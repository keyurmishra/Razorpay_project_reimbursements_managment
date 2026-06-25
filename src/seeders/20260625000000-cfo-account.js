'use strict';

const bcrypt = require('bcryptjs');

// Must match the BCRYPT_SALT_ROUNDS used throughout the app (auth.service.js).
const BCRYPT_SALT_ROUNDS = 12;

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  /**
   * up — Insert the CFO seed account.
   *
   * The `passwordHash` field is mapped to the `password_hash` column in the DB
   * because the User model is initialised with `underscored: true`.
   *
   * Sequelize-cli does NOT run model hooks inside seeders, so we hash the
   * password manually here before building the insert payload.
   *
   * @param {import('sequelize').QueryInterface} queryInterface
   * @param {import('sequelize').Sequelize} Sequelize
   */
  async up(queryInterface, Sequelize) {
    const passwordHash = await bcrypt.hash('CFO#ORG@April2026', BCRYPT_SALT_ROUNDS);

    await queryInterface.bulkInsert(
      'users',
      [
        {
          name: 'CFO',
          email: 'cfo@org.com',
          password_hash: passwordHash,   // underscored column name
          role: 'CFO',
          created_at: new Date(),        // underscored timestamp columns
          updated_at: new Date(),
        },
      ],
      {
        // Skip this seed silently if the CFO email already exists,
        // making the seeder safe to run more than once.
        ignoreDuplicates: true,
      }
    );
  },

  /**
   * down — Remove the CFO seed account.
   *
   * Scoped to this exact email so rollback is surgical and never
   * deletes real users created through the application.
   *
   * @param {import('sequelize').QueryInterface} queryInterface
   * @param {import('sequelize').Sequelize} Sequelize
   */
  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete(
      'users',
      { email: 'cfo@org.com' },
      {}
    );
  },
};
