using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace grey_pile_api.Migrations
{
    /// <inheritdoc />
    public partial class JournalEntriesCascadeDelete : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // The FK was originally created as RESTRICT. Change it to CASCADE so
            // that deleting a model (or cascading from unit/faction) also removes
            // its journal history automatically.
            migrationBuilder.DropForeignKey(
                name: "FK_journal_entries_models_model_id",
                table: "journal_entries");

            migrationBuilder.AddForeignKey(
                name: "FK_journal_entries_models_model_id",
                table: "journal_entries",
                column: "model_id",
                principalTable: "models",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_journal_entries_models_model_id",
                table: "journal_entries");

            migrationBuilder.AddForeignKey(
                name: "FK_journal_entries_models_model_id",
                table: "journal_entries",
                column: "model_id",
                principalTable: "models",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
