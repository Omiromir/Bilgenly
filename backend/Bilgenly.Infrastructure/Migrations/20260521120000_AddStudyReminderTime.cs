using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Bilgenly.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddStudyReminderTime : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "StudyReminderTime",
                table: "UserPreferences",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "StudyReminderTime",
                table: "UserPreferences");
        }
    }
}
