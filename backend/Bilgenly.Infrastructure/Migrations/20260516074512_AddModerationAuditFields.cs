using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Bilgenly.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddModerationAuditFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "SuspendedAt",
                table: "Users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "SuspendedByUserId",
                table: "Users",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "HiddenAt",
                table: "Quizzes",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "HiddenByUserId",
                table: "Quizzes",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_IsSuspended",
                table: "Users",
                column: "IsSuspended");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Role",
                table: "Users",
                column: "Role");

            migrationBuilder.CreateIndex(
                name: "IX_Users_SuspendedByUserId",
                table: "Users",
                column: "SuspendedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Quizzes_HiddenByUserId",
                table: "Quizzes",
                column: "HiddenByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Quizzes_IsHidden",
                table: "Quizzes",
                column: "IsHidden");

            migrationBuilder.AddForeignKey(
                name: "FK_Quizzes_Users_HiddenByUserId",
                table: "Quizzes",
                column: "HiddenByUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Users_Users_SuspendedByUserId",
                table: "Users",
                column: "SuspendedByUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Quizzes_Users_HiddenByUserId",
                table: "Quizzes");

            migrationBuilder.DropForeignKey(
                name: "FK_Users_Users_SuspendedByUserId",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Users_IsSuspended",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Users_Role",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Users_SuspendedByUserId",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Quizzes_HiddenByUserId",
                table: "Quizzes");

            migrationBuilder.DropIndex(
                name: "IX_Quizzes_IsHidden",
                table: "Quizzes");

            migrationBuilder.DropColumn(
                name: "SuspendedAt",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "SuspendedByUserId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "HiddenAt",
                table: "Quizzes");

            migrationBuilder.DropColumn(
                name: "HiddenByUserId",
                table: "Quizzes");
        }
    }
}
