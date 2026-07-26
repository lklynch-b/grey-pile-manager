using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace grey_pile_api.Migrations
{
    /// <inheritdoc />
    public partial class UpdatingPaints : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<long>(
                name: "faction_id",
                table: "recipes",
                type: "bigint",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_recipes_faction_id",
                table: "recipes",
                column: "faction_id");

            migrationBuilder.AddForeignKey(
                name: "FK_recipes_factions_faction_id",
                table: "recipes",
                column: "faction_id",
                principalTable: "factions",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_recipes_factions_faction_id",
                table: "recipes");

            migrationBuilder.DropIndex(
                name: "IX_recipes_faction_id",
                table: "recipes");

            migrationBuilder.DropColumn(
                name: "faction_id",
                table: "recipes");
        }
    }
}
