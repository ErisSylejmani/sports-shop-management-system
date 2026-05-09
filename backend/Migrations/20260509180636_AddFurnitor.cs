using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddFurnitor : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Furnitoret",
                columns: table => new
                {
                    FurnitorId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Emri = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    PersoniKontaktit = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Telefoni = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: true),
                    Email = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    Adresa = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Qyteti = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: true),
                    Shteti = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Furnitoret", x => x.FurnitorId);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Furnitoret_Emri",
                table: "Furnitoret",
                column: "Emri");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Furnitoret");
        }
    }
}
