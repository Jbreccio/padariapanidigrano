import { useState, useRef, useEffect } from "react";
import { X, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { categories } from "../data/products";
import { cn } from "../lib/utils";

interface MenuSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
}

const MenuSidebar = ({ isOpen, onClose, selectedCategory, onSelectCategory }: MenuSidebarProps) => {
  const handleSelect = (catId: string) => {
    onSelectCategory(catId);
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed top-0 left-0 h-full w-80 bg-card border-r border-border z-50 transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-sidebar-background">
          <h2 className="font-display text-xl font-bold text-secondary">Categorias</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Category List */}
        <ScrollArea className="flex-1">
          <div className="py-2">
            {/* All */}
            <button
              onClick={() => handleSelect("all")}
              className={cn(
                "w-full flex items-center justify-between px-5 py-4 text-left transition-all duration-200 hover:bg-sidebar-accent",
                selectedCategory === "all"
                  ? "bg-sidebar-accent border-l-4 border-secondary text-secondary font-semibold"
                  : "border-l-4 border-transparent text-foreground"
              )}
            >
              <span className="text-sm">Todos os Produtos</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>

            {/* Divider */}
            <div className="mx-5 my-1 border-t border-border" />

            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleSelect(cat.id)}
                className={cn(
                  "w-full flex items-center justify-between px-5 py-4 text-left transition-all duration-200 hover:bg-sidebar-accent group",
                  selectedCategory === cat.id
                    ? "bg-sidebar-accent border-l-4 border-secondary text-secondary font-semibold"
                    : "border-l-4 border-transparent text-foreground"
                )}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">{cat.name}</span>
                  <span className="text-xs text-muted-foreground line-clamp-1">{cat.description}</span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-secondary transition-colors" />
              </button>
            ))}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-sidebar-background">
          <p className="text-xs text-muted-foreground text-center">
            {categories.length} categorias disponíveis
          </p>
        </div>
      </div>
    </>
  );
};

export default MenuSidebar;