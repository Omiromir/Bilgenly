using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Bilgenly.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddQuestionTags : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Per-question topic tags. IF NOT EXISTS keeps this safe across re-runs,
            // and DEFAULT '{}' backfills existing rows so the NOT NULL constraint holds
            // without a separate data migration.
            migrationBuilder.Sql(
                "ALTER TABLE \"Question\" ADD COLUMN IF NOT EXISTS \"Tags\" text[] NOT NULL DEFAULT '{}';");

            // Repair pre-existing model drift: Attempt.AssignmentId was added in code
            // (per-assignment attempt scoping) but never captured by a migration. This
            // creates the column on fresh databases while IF NOT EXISTS skips it on the
            // current database where it was added out of band, so startup never fails.
            migrationBuilder.Sql(
                "ALTER TABLE \"Attempts\" ADD COLUMN IF NOT EXISTS \"AssignmentId\" uuid NULL;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("ALTER TABLE \"Attempts\" DROP COLUMN IF EXISTS \"AssignmentId\";");
            migrationBuilder.Sql("ALTER TABLE \"Question\" DROP COLUMN IF EXISTS \"Tags\";");
        }
    }
}
