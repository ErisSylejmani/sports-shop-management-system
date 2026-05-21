using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class LinkApplicationUserPunetor : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "PunetorId",
                table: "AspNetUsers",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_PunetorId",
                table: "AspNetUsers",
                column: "PunetorId",
                unique: true,
                filter: "[PunetorId] IS NOT NULL");

            migrationBuilder.AddForeignKey(
                name: "FK_AspNetUsers_Punetoret_PunetorId",
                table: "AspNetUsers",
                column: "PunetorId",
                principalTable: "Punetoret",
                principalColumn: "PunetorId",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AspNetUsers_Punetoret_PunetorId",
                table: "AspNetUsers");

            migrationBuilder.DropIndex(
                name: "IX_AspNetUsers_PunetorId",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "PunetorId",
                table: "AspNetUsers");
        }
    }
}
