using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Bilgenly.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddQuizSourceText : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SourceText",
                table: "Quizzes",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SourceText",
                table: "Quizzes");
        }
    }
}
