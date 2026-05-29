using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Bilgenly.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddIconToBadge : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Icon",
                table: "Badges",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Icon",
                table: "Badges");
        }
    }
}
