@tool
extends EditorPlugin

func _enter_tree():
	add_custom_type("MerebMultiplayer", "Node", preload("MerebMultiplayer.gd"), preload("icon.svg"))

func _exit_tree():
	remove_custom_type("MerebMultiplayer")
